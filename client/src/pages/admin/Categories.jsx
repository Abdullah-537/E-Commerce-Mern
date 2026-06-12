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

  const iconOptions = [
    { value: 'folder', label: 'Default Folder' },
    { value: 'tv', label: 'Electronics / TV' },
    { value: 'laptop', label: 'Computers' },
    { value: 'mobile-alt', label: 'Phones & Tablets' },
    { value: 'tshirt', label: 'Clothing' },
    { value: 'shoe-prints', label: 'Footwear' },
    { value: 'home', label: 'Home & Living' },
    { value: 'couch', label: 'Furniture' },
    { value: 'car', label: 'Automotive' },
    { value: 'book', label: 'Books & Stationery' },
    { value: 'gamepad', label: 'Gaming' },
    { value: 'basketball-ball', label: 'Sports' },
    { value: 'shopping-basket', label: 'Groceries' },
    { value: 'gift', label: 'Gifts & Toys' },
    { value: 'heart', label: 'Health & Beauty' },
    { value: 'gem', label: 'Jewelry' },
    { value: 'camera', label: 'Photography' }
  ]

  const openEdit = (cat) => {
    setEditId(cat._id)
    setForm({ name: cat.name, parentId: cat.parentId || '', imageUrl: cat.imageUrl || 'folder' })
    setShowForm(true)
  }

  const openAdd = (parentId = '') => {
    setEditId(null)
    setForm({ name: '', parentId, imageUrl: 'folder' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { name: form.name, parentId: form.parentId || null, imageUrl: form.imageUrl || 'folder' }

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
      setForm({ name: '', parentId: '', imageUrl: 'folder' })
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
      <div className="card mb-3 border-translucent shadow-sm" style={{ 
        marginLeft: depth * 28,
        borderRadius: '12px',
        borderLeft: depth > 0 ? '4px solid #0051d4' : '1px solid var(--phoenix-border-color)'
      }}>
        <div className="card-body py-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center bg-body-highlight rounded-3" style={{ width: 48, height: 48, border: '1px solid #e2e8f0' }}>
              <span className={`fas fa-${cat.imageUrl && !cat.imageUrl.startsWith('data:') && !cat.imageUrl.startsWith('http') ? cat.imageUrl : 'folder'} text-primary fs-6`}></span>
            </div>
            <div>
              <h6 className="mb-0 text-body-emphasis fw-bold">
                {depth > 0 && <span className="fas fa-level-up-alt fa-rotate-90 me-2 text-muted fs-11"></span>}
                {cat.name}
              </h6>
              <span className="text-muted fs-10 fw-semibold">{cat.slug}</span>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-phoenix-primary btn-xs rounded-circle p-2" onClick={() => openAdd(cat._id)} title="Add Subcategory">
              <span className="fas fa-plus"></span>
            </button>
            <button className="btn btn-phoenix-secondary btn-xs rounded-circle p-2" onClick={() => openEdit(cat)} title="Edit">
              <span className="fas fa-edit"></span>
            </button>
            <button className="btn btn-phoenix-danger btn-xs rounded-circle p-2" onClick={() => deleteCategory(cat._id)} title="Delete">
              <span className="fas fa-trash-alt"></span>
            </button>
          </div>
        </div>
      </div>
      {cat.children?.map(child => renderCategory(child, depth + 1))}
    </div>
  )

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="mb-1 text-body-emphasis fw-bold">Marketplace Categories</h3>
          <p className="text-muted fs-9 mb-0">Organize and structure items across the store catalog.</p>
        </div>
        <button className="btn btn-primary fw-bold rounded-pill" onClick={() => openAdd()}>
          <span className="fas fa-plus me-2"></span>Add Category
        </button>
      </div>

      {/* Add/Edit Form Card */}
      {showForm && (
        <div className="card mb-4 border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="card-header bg-white border-bottom border-translucent py-3">
            <h5 className="mb-0 text-body-emphasis fw-bold">
              <span className={`fas fa-${editId ? 'edit' : 'plus-circle'} me-2 text-primary`}></span>
              {editId ? 'Edit Category Node' : form.parentId ? 'Add Child Category' : 'Create Top-Level Category'}
            </h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted fw-bold fs-10 uppercase">Category Name</label>
                  <input 
                    type="text"
                    className="form-control bg-body-highlight border-translucent" 
                    placeholder="e.g. Smart Electronics" 
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted fw-bold fs-10 uppercase">Parent Category</label>
                  <select 
                    className="form-select bg-body-highlight border-translucent fw-semibold text-body-emphasis" 
                    value={form.parentId}
                    onChange={e => setForm({ ...form, parentId: e.target.value })}
                  >
                    <option value="">— No Parent (Top Level) —</option>
                    {flatCategories.map(c => (
                      <option key={c._id} value={c._id}>
                        {'— '.repeat(c.depth)} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted fw-bold fs-10 uppercase">Category Icon</label>
                  <div className="input-group">
                    <span className="input-group-text bg-body-highlight border-translucent">
                      <span className={`fas fa-${form.imageUrl || 'folder'}`}></span>
                    </span>
                    <select 
                      className="form-select bg-body-highlight border-translucent text-body-emphasis" 
                      value={form.imageUrl}
                      onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                    >
                      {iconOptions.map(icon => (
                        <option key={icon.value} value={icon.value}>{icon.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary fw-bold">
                  {editId ? 'Update Node' : 'Add Category'}
                </button>
                <button type="button" className="btn btn-phoenix-secondary fw-bold" onClick={() => { setShowForm(false); setEditId(null) }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-5">
          <span className="fas fa-folder-open fs-3 text-muted d-block mb-3"></span>
          <h5 className="text-muted fw-semibold">No category listings yet</h5>
          <p className="text-muted fs-10 mb-4">Start by adding your first category structure.</p>
          <button className="btn btn-primary btn-sm fw-bold px-4 py-2" onClick={() => openAdd()}>Add First Category</button>
        </div>
      ) : (
        <div className="row">
          <div className="col-12">
            {categories.map(cat => renderCategory(cat))}
          </div>
        </div>
      )}
    </div>
  )
}