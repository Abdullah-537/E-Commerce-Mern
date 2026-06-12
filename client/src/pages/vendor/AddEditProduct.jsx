import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function AddEditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    salePrice: '',
    stock: '',
    categoryId: '',
    images: [],
    tags: [],
    status: 'published',
    hasVariants: false,
  })
  const [variants, setVariants] = useState([
    { optionName: 'Size', optionValues: [{ value: '', image: '' }] }
  ])
  const [tagInput, setTagInput] = useState('')
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    api.get('/categories').then(res => {
      const cats = res.data.data
      const flatCats = []
      const flatten = (cList, depth = 0) => {
        cList.forEach(c => {
          flatCats.push({ ...c, depth })
          if (c.children?.length) flatten(c.children, depth + 1)
        })
      }
      flatten(cats)
      setCategories(flatCats)
    }).catch(() => {})
    if (id) {
      api.get(`/products/${id}`).then(res => {
        const p = res.data.data
        setForm({
          name: p.name || '',
          description: p.description || '',
          price: p.price || '',
          salePrice: p.salePrice || '',
          stock: p.stock || '',
          categoryId: p.categoryId?._id || p.categoryId || '',
          images: p.images || [],
          tags: p.tags || [],
          status: p.status || 'published',
          hasVariants: p.hasVariants || false,
        })
        if (p.variants && p.variants.length > 0) {
          const variantGroups = {}
          p.variants.forEach(v => {
            if (!variantGroups[v.name]) variantGroups[v.name] = []
            variantGroups[v.name].push({ value: v.value, image: v.image || '' })
          })
          const mapped = Object.entries(variantGroups).map(([optionName, optionValues]) => ({
            optionName,
            optionValues
          }))
          if (mapped.length > 0) setVariants(mapped)
        }
      }).catch(() => {})
    }
  }, [id])

  const handleImageUpload = (files) => {
    const fileList = Array.from(files)
    Promise.all(fileList.map(file => {
      return new Promise((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`)
          reject()
          return
        }
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error)
      })
    })).then(base64Images => {
      setForm(prev => ({ ...prev, images: [...prev.images, ...base64Images] }))
    }).catch(() => {})
  }

  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }

  const removeTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const addVariantOption = () => {
    setVariants(prev => [...prev, { optionName: '', optionValues: [{ value: '', image: '' }] }])
  }

  const removeVariantOption = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index))
  }

  const updateVariantName = (index, name) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, optionName: name } : v))
  }

  const updateVariantValue = (optIndex, valIndex, value) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== optIndex) return v
      const newValues = [...v.optionValues]
      newValues[valIndex] = { ...newValues[valIndex], value }
      return { ...v, optionValues: newValues }
    }))
  }

  const updateVariantImage = (optIndex, valIndex, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      setVariants(prev => prev.map((v, i) => {
        if (i !== optIndex) return v
        const newValues = [...v.optionValues]
        newValues[valIndex] = { ...newValues[valIndex], image: reader.result }
        return { ...v, optionValues: newValues }
      }))
    }
  }

  const addVariantValue = (optIndex) => {
    setVariants(prev => prev.map((v, i) => i === optIndex ? { ...v, optionValues: [...v.optionValues, { value: '', image: '' }] } : v))
  }

  const removeVariantValue = (optIndex, valIndex) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== optIndex) return v
      return { ...v, optionValues: v.optionValues.filter((_, vi) => vi !== valIndex) }
    }))
  }

  // Build flat variants array matching schema
  const buildFlatVariants = () => {
    const flatVariants = []
    variants.forEach(v => {
      if (!v.optionName) return
      v.optionValues.forEach(val => {
        if (val.value.trim()) {
          flatVariants.push({
            name: v.optionName,
            value: val.value.trim(),
            image: val.image || ''
          })
        }
      })
    })
    return flatVariants
  }

  // Build variant combinations for pricing/stock
  const buildCombinations = () => {
    const validOptions = variants.filter(v => v.optionName && v.optionValues.some(val => val.value.trim()))
    if (validOptions.length === 0) return []

    const combine = (options) => {
      if (options.length === 0) return [{}]
      const [first, ...rest] = options
      const restCombos = combine(rest)
      const combos = []
      for (const val of first.optionValues.filter(v => v.value.trim())) {
        for (const combo of restCombos) {
          combos.push({ [first.optionName]: val.value.trim(), ...combo })
        }
      }
      return combos
    }

    return combine(validOptions).map(attributes => ({
      attributes,
      price: form.price || 0,
      stock: 0,
    }))
  }

  const handleSubmit = async (status = 'published') => {
    if (!form.name.trim()) { toast.error('Product name is required'); return }
    if (!form.categoryId) { toast.error('Please select a category'); return }
    if (!form.price && status === 'published') { toast.error('Price is required'); return }

    setLoading(true)
    try {
      const payload = {
        ...form,
        status,
        price: parseFloat(form.price) || 0,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        stock: parseInt(form.stock) || 0,
        hasVariants: variants.some(v => v.optionName && v.optionValues.some(val => val.value.trim())),
      }

      if (payload.hasVariants) {
        payload.productVariants = buildFlatVariants()
        payload.variants = buildCombinations()
      }

      if (id) {
        await api.put(`/products/${id}`, payload)
        toast.success('Product updated successfully')
      } else {
        await api.post('/products', payload)
        toast.success(status === 'draft' ? 'Draft saved' : 'Product published')
      }
      navigate('/vendor/products')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-2" aria-label="breadcrumb">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/vendor">Dashboard</Link></li>
          <li className="breadcrumb-item"><Link to="/vendor/products">Products</Link></li>
          <li className="breadcrumb-item active">{id ? 'Edit Product' : 'Add Product'}</li>
        </ol>
      </nav>

      {/* Header with Actions */}
      <div className="row g-3 flex-between-end mb-5">
        <div className="col-auto">
          <h2 className="mb-2 text-body-emphasis">{id ? 'Edit product' : 'Add a product'}</h2>
          <h5 className="text-body-tertiary fw-semibold">Orders placed across your store</h5>
        </div>
        <div className="col-auto d-flex gap-2">
          <button
            className="btn btn-phoenix-secondary"
            type="button"
            onClick={() => navigate('/vendor/products')}
          >
            Discard
          </button>
          <button
            className="btn btn-phoenix-primary"
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('draft')}
          >
            {loading ? 'Saving...' : 'Save draft'}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('published')}
          >
            {loading ? 'Publishing...' : 'Publish product'}
          </button>
        </div>
      </div>

      <div className="row g-5">
        {/* ==================== LEFT COLUMN ==================== */}
        <div className="col-12 col-xl-8">

          {/* Product Title */}
          <h4 className="mb-3">Product Title</h4>
          <input
            className="form-control mb-5"
            type="text"
            placeholder="Write title here..."
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          {/* Product Description */}
          <div className="mb-6">
            <h4 className="mb-3">Product Description</h4>
            <textarea
              className="form-control"
              rows="6"
              placeholder="Write a description here..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            ></textarea>
          </div>

          {/* Display Images */}
          <h4 className="mb-3">Display images</h4>
          <div className="mb-5">
            {/* Dropzone */}
            <div
              className={`border-2 border-dashed rounded-3 p-4 text-center mb-3 ${dragOver ? 'border-primary bg-primary bg-opacity-10' : 'border-translucent'}`}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => document.getElementById('product-images-input').click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                handleImageUpload(e.dataTransfer.files)
              }}
            >
              <span className="fas fa-cloud-upload-alt fs-3 text-body-quaternary d-block mb-2"></span>
              <p className="text-body-tertiary mb-1">Drag your photo here or <span className="text-primary fw-bold">Browse from device</span></p>
              <p className="text-body-quaternary fs-10 mb-0">Supports: JPG, PNG, WEBP (Max 5MB each)</p>
            </div>
            <input
              type="file"
              id="product-images-input"
              className="d-none"
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(e.target.files)}
            />

            {/* Image Previews */}
            {form.images.length > 0 && (
              <div className="d-flex flex-wrap gap-2">
                {form.images.map((img, index) => (
                  <div key={index} className="position-relative border border-translucent rounded-3 overflow-hidden" style={{ width: 100, height: 100 }}>
                    <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      className="btn btn-sm position-absolute top-0 end-0 p-0 m-1 d-flex align-items-center justify-content-center bg-danger rounded-circle"
                      style={{ width: 22, height: 22 }}
                      onClick={() => removeImage(index)}
                    >
                      <span className="fas fa-times text-white" style={{ fontSize: 10 }}></span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inventory — Pricing & Restock */}
          <h4 className="mb-3">Inventory</h4>
          <div className="row g-0 border-top border-bottom border-translucent">
            <div className="col-sm-4">
              <div className="nav flex-sm-column border-bottom border-bottom-sm-0 border-end-sm fs-9 vertical-tab h-100 justify-content-between" role="tablist" aria-orientation="vertical">
                <a className="nav-link border-end border-end-sm-0 border-bottom-sm text-center text-sm-start cursor-pointer outline-none d-sm-flex align-items-sm-center active" id="pricingTab" data-bs-toggle="tab" data-bs-target="#pricingTabContent" role="tab" aria-controls="pricingTabContent" aria-selected="true">
                  <span className="fas fa-tag me-sm-2 fs-4 nav-icons"></span><span className="d-none d-sm-inline">Pricing</span>
                </a>
                <a className="nav-link border-end border-end-sm-0 border-bottom-sm text-center text-sm-start cursor-pointer outline-none d-sm-flex align-items-sm-center" id="restockTab" data-bs-toggle="tab" data-bs-target="#restockTabContent" role="tab" aria-controls="restockTabContent" aria-selected="false">
                  <span className="fas fa-box me-sm-2 fs-4 nav-icons"></span><span className="d-none d-sm-inline">Restock</span>
                </a>
                <a className="nav-link text-center text-sm-start cursor-pointer outline-none d-sm-flex align-items-sm-center" id="shippingTab" data-bs-toggle="tab" data-bs-target="#shippingTabContent" role="tab" aria-controls="shippingTabContent" aria-selected="false">
                  <span className="fas fa-truck me-sm-2 fs-4 nav-icons"></span><span className="d-none d-sm-inline">Shipping</span>
                </a>
              </div>
            </div>
            <div className="col-sm-8">
              <div className="tab-content py-3 ps-sm-4 h-100">
                {/* Pricing Tab */}
                <div className="tab-pane fade show active" id="pricingTabContent" role="tabpanel">
                  <h4 className="mb-3 d-sm-none">Pricing</h4>
                  <div className="row g-3">
                    <div className="col-12 col-lg-6">
                      <h5 className="mb-2 text-body-highlight">Regular price</h5>
                      <input
                        className="form-control"
                        type="number"
                        placeholder="PKR"
                        value={form.price}
                        onChange={e => setForm({ ...form, price: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-lg-6">
                      <h5 className="mb-2 text-body-highlight">Sale price</h5>
                      <input
                        className="form-control"
                        type="number"
                        placeholder="PKR"
                        value={form.salePrice}
                        onChange={e => setForm({ ...form, salePrice: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                {/* Restock Tab */}
                <div className="tab-pane fade h-100" id="restockTabContent" role="tabpanel" aria-labelledby="restockTab">
                  <div className="d-flex flex-column h-100">
                    <h5 className="mb-3 text-body-highlight">Add to Stock</h5>
                    <div className="row g-3 flex-1 mb-4">
                      <div className="col-sm-12">
                        <input
                          className="form-control"
                          type="number"
                          placeholder="Quantity"
                          value={form.stock}
                          onChange={e => setForm({ ...form, stock: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Shipping Tab */}
                <div className="tab-pane fade h-100" id="shippingTabContent" role="tabpanel">
                  <div className="d-flex flex-column h-100">
                    <h5 className="mb-3 text-body-highlight">Shipping Type</h5>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="shippingType" id="platformFulfilled" checked readOnly />
                      <label className="form-check-label fw-bold text-body-highlight" htmlFor="platformFulfilled">
                        Fulfilled by ShopZone <span className="badge badge-phoenix badge-phoenix-warning ms-1 fs-11">DEFAULT</span>
                      </label>
                      <p className="text-body-tertiary fs-10 mb-0">Your product, our responsibility. We will handle the delivery.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN — Organize & Variants ==================== */}
        <div className="col-12 col-xl-4">
          {/* Organize Card */}
          <div className="card mb-3 border border-translucent">
            <div className="card-body">
              <h4 className="card-title mb-4">Organize</h4>
              <div className="row gx-3">
                {/* Category */}
                <div className="col-12 col-sm-6 col-xl-12">
                  <div className="mb-4">
                    <div className="d-flex flex-wrap flex-between-center mb-2">
                      <h5 className="mb-0 text-body-highlight me-2">Category</h5>
                    </div>
                    <select
                      className="form-select mb-3"
                      aria-label="category"
                      value={form.categoryId}
                      onChange={e => setForm({ ...form, categoryId: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>
                          {'— '.repeat(cat.depth)} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div className="col-12 col-sm-6 col-xl-12">
                  <div className="mb-4">
                    <div className="d-flex flex-wrap flex-between-center mb-2">
                      <h5 className="mb-0 text-body-highlight me-2">Tags</h5>
                    </div>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                      />
                      <button id="add-tag-btn" type="button" className="btn btn-sm btn-phoenix-primary" onClick={addTag}>Add</button>
                    </div>
                    <div className="mb-3">
                      <span className="text-body-tertiary fs-10 me-2">Suggested:</span>
                      {['fashion', 'electronics', 'new', 'trending', 'sale'].map(tag => (
                        <span key={tag} className="badge badge-phoenix badge-phoenix-secondary me-1 cursor-pointer" onClick={() => { setTagInput(tag); setTimeout(() => document.getElementById('add-tag-btn').click(), 0) }} style={{ cursor: 'pointer' }}>+{tag}</span>
                      ))}
                    </div>
                    {form.tags.length > 0 && (
                      <div className="d-flex flex-wrap gap-1">
                        {form.tags.map(tag => (
                          <span key={tag} className="badge badge-phoenix badge-phoenix-primary d-flex align-items-center gap-1 fs-10">
                            {tag}
                            <span className="fas fa-times cursor-pointer" style={{ fontSize: 8, cursor: 'pointer' }} onClick={() => removeTag(tag)}></span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Variants Card */}
          <div className="card border border-translucent">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="card-title mb-0">Variants</h4>
                <button
                  type="button"
                  className="btn btn-sm btn-phoenix-primary rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 28, height: 28 }}
                  onClick={addVariantOption}
                  title="Add variant option"
                >
                  <span className="fas fa-plus fs-10"></span>
                </button>
              </div>

              {variants.map((variant, optIndex) => (
                <div key={optIndex} className="mb-4 pb-3 border-bottom border-translucent">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="text-body-highlight mb-0">Option {optIndex + 1}</h6>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-link text-danger p-0 fs-10"
                        onClick={() => removeVariantOption(optIndex)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Option Name */}
                  <select
                    className="form-select form-select-sm mb-2"
                    value={variant.optionName}
                    onChange={e => updateVariantName(optIndex, e.target.value)}
                  >
                    <option value="">Select option type</option>
                    <option value="Size">Size</option>
                    <option value="Color">Color</option>
                    <option value="Material">Material</option>
                    <option value="Style">Style</option>
                    <option value="Weight">Weight</option>
                  </select>

                  {/* Option Values */}
                  <div className="d-flex flex-column gap-2">
                    {variant.optionValues.map((val, valIndex) => (
                      <div key={valIndex} className="d-flex gap-2 align-items-center bg-light p-2 rounded">
                        {/* Variant Image */}
                        <div className="position-relative" style={{ width: 40, height: 40, flexShrink: 0 }}>
                          {val.image ? (
                            <>
                              <img src={val.image} alt="variant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="rounded border" />
                              <button 
                                type="button" 
                                className="btn btn-sm position-absolute top-0 end-0 p-0 m-0 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: 16, height: 16, transform: 'translate(25%, -25%)' }}
                                onClick={() => {
                                  const e = { target: { value: '' } }
                                  updateVariantImage(optIndex, valIndex, null)
                                }}
                              >
                                <span className="fas fa-times" style={{ fontSize: 8 }}></span>
                              </button>
                            </>
                          ) : (
                            <div 
                              className="border border-dashed rounded d-flex align-items-center justify-content-center bg-white cursor-pointer w-100 h-100"
                              onClick={() => document.getElementById(`variant-img-${optIndex}-${valIndex}`).click()}
                              title="Add variant image"
                            >
                              <span className="fas fa-image text-body-tertiary fs-10"></span>
                            </div>
                          )}
                          <input 
                            type="file" 
                            id={`variant-img-${optIndex}-${valIndex}`} 
                            className="d-none" 
                            accept="image/*"
                            onChange={(e) => updateVariantImage(optIndex, valIndex, e.target.files[0])}
                          />
                        </div>
                        
                        {/* Variant Text */}
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder={`e.g. ${variant.optionName === 'Size' ? 'Medium' : variant.optionName === 'Color' ? 'Black' : 'Value'}`}
                          value={val.value}
                          onChange={e => updateVariantValue(optIndex, valIndex, e.target.value)}
                        />
                        
                        {/* Remove */}
                        {variant.optionValues.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-phoenix-danger px-2"
                            onClick={() => removeVariantValue(optIndex, valIndex)}
                          >
                            <span className="fas fa-trash-alt fs-10"></span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-link text-primary p-0 mt-2 fs-10"
                    onClick={() => addVariantValue(optIndex)}
                  >
                    + Add value
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-phoenix-secondary w-100 btn-sm"
                onClick={addVariantOption}
              >
                Add another option
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}