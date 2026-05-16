import { useState, useEffect } from 'react'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', parentId: '', imagePreview: '', imageUrl: '' })

  const fetchCategories = () => {
    api.get('/categories').then(res => setCategories(res.data.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchCategories() }, [])

  // Flatten categories for parent dropdown
  const flatCategories = []
  const flatten = (cats, depth = 0) => {
    cats.forEach(c => {
      flatCategories.push({ ...c, depth })
      if (c.children?.length) flatten(c.children, depth + 1)
    })
  }
  flatten(categories)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB')
    const reader = new FileReader()
    reader.onloadend = () => {
      setForm({ ...form, imagePreview: reader.result, imageUrl: reader.result })
    }
    reader.readAsDataURL(file)
  }

  const openEdit = (cat) => {
    setEditId(cat._id)
    setForm({ name: cat.name, parentId: cat.parentId || '', imagePreview: cat.imageUrl || '', imageUrl: '' })
    setShowForm(true)
  }

  const openAdd = (parentId = '') => {
    setEditId(null)
    setForm({ name: '', parentId, imagePreview: '', imageUrl: '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { name: form.name, parentId: form.parentId || null }
    if (form.imageUrl) payload.imageUrl = form.imageUrl

    try {
      if (editId) {
        await api.put(`/categories/${editId}`, payload)
        toast.success('Category updated')
      } else {
        await api.post('/categories', payload)
        toast.success('Category created')
      }
      setShowForm(false)
      setEditId(null)
      setForm({ name: '', parentId: '', imagePreview: '', imageUrl: '' })
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const deleteCategory = async (id) => {
    if (!window.confirm('Are you sure? This will deactivate the category.')) return
    try {
      await api.delete(`/categories/${id}`)
      toast.success('Category deleted')
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  const renderCategory = (cat, depth = 0) => (
    <div key={cat._id}>
      <div className={`card mb-2 border-translucent ${depth > 0 ? '' : ''}`} style={{ marginLeft: depth * 24 }}>
        <div className="card-body py-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            {cat.imageUrl ? (
              <img src={cat.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <div className="d-flex align-items-center justify-content-center bg-body-highlight rounded-2" style={{ width: 44, height: 44 }}>
                <span className="fas fa-folder text-body-quaternary"></span>
              </div>
            )}
            <div>
              <h6 className="mb-0 text-body-emphasis">
                {depth > 0 && <span className="fas fa-level-up-alt fa-rotate-90 me-1 text-body-quaternary fs-10"></span>}
                {cat.name}
              </h6>
              <small className="text-body-tertiary fs-10">{cat.slug}</small>
            </div>
          </div>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-phoenix-primary py-0 px-2" onClick={() => openAdd(cat._id)} title="Add Subcategory">
              <span className="fas fa-plus fs-10"></span>
            </button>
            <button className="btn btn-sm btn-phoenix-secondary py-0 px-2" onClick={() => openEdit(cat)} title="Edit">
              <span className="fas fa-edit fs-10"></span>
            </button>
            <button className="btn btn-sm btn-phoenix-danger py-0 px-2" onClick={() => deleteCategory(cat._id)} title="Delete">
              <span className="fas fa-trash-alt fs-10"></span>
            </button>
          </div>
        </div>
      </div>
      {cat.children?.map(child => renderCategory(child, depth + 1))}
    </div>
  )

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="mb-1 text-body-emphasis">Categories</h3>
          <p className="text-body-tertiary fs-9 mb-0">Manage product categories and subcategories</p>
        </div>
        <button className="btn btn-primary" onClick={() => openAdd()}>
          <span className="fas fa-plus me-1"></span> Add Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card mb-4 border-primary border-opacity-25">
          <div className="card-header bg-body-highlight">
            <h5 className="mb-0 text-body-emphasis">
              <span className={`fas fa-${editId ? 'edit' : 'plus-circle'} me-2 text-primary`}></span>
              {editId ? 'Edit Category' : form.parentId ? 'Add Subcategory' : 'Add Category'}
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fs-8 text-body-highlight">Category Name</label>
                  <input className="form-control" placeholder="e.g. Electronics" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-8 text-body-highlight">Parent Category (optional)</label>
                  <select className="form-select" value={form.parentId}
                    onChange={e => setForm({ ...form, parentId: e.target.value })}>
                    <option value="">— No Parent (Top Level) —</option>
                    {flatCategories.map(c => (
                      <option key={c._id} value={c._id}>
                        {'—'.repeat(c.depth)} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-8 text-body-highlight">Category Image</label>
                  <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
                </div>
                <div className="col-md-6 d-flex align-items-end">
                  {form.imagePreview && (
                    <img src={form.imagePreview} alt="Preview" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                  )}
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button type="submit" className="btn btn-primary">
                  {editId ? 'Update' : 'Create'} Category
                </button>
                <button type="button" className="btn btn-phoenix-secondary" onClick={() => { setShowForm(false); setEditId(null) }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-5">
          <span className="fas fa-folder-open fs-3 text-body-quaternary d-block mb-3"></span>
          <h5 className="text-body-tertiary">No categories yet</h5>
          <p className="text-body-quaternary mb-3">Start by adding your first category</p>
          <button className="btn btn-sm btn-primary" onClick={() => openAdd()}>Add First Category</button>
        </div>
      ) : (
        <div>
          {categories.map(cat => renderCategory(cat))}
        </div>
      )}
    </div>
  )
}