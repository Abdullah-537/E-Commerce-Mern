import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'

export default function AllProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState([])

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                        p.vendorId?.businessName?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true :
                        filter === 'active' ? p.isActive :
                        filter === 'inactive' ? !p.isActive : true
    return matchSearch && matchFilter
  })

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleAll = () => {
    setSelected(selected.length === filtered.length ? [] : filtered.map(p => p._id))
  }

  const counts = {
    all: products.length,
    active: products.filter(p => p.isActive).length,
    inactive: products.filter(p => !p.isActive).length,
  }

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2" style={{ fontSize: '0.8rem' }}>
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none">Admin</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Products</li>
          </ol>
        </nav>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h3 className="text-body-emphasis fw-bold mb-1">Product Catalog</h3>
            <p className="text-muted fs-9 mb-0">Browse, filter, and manage all marketplace product listings.</p>
          </div>
          <button className="btn btn-phoenix-secondary btn-sm fw-bold rounded-pill">
            <span className="fas fa-file-export me-2"></span>Export CSV
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <ul className="nav nav-underline mb-4 fs-9 border-bottom border-translucent gap-1">
        {[
          { key: 'all', label: 'All Products', count: counts.all },
          { key: 'active', label: 'Published', count: counts.active },
          { key: 'inactive', label: 'Drafts', count: counts.inactive },
        ].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button
              className={`nav-link pb-3 ${filter === tab.key ? 'active fw-bold' : 'text-body-tertiary'}`}
              onClick={() => setFilter(tab.key)}
              style={{ borderBottomWidth: '3px' }}
            >
              {tab.label} <span className="badge bg-light text-dark ms-1 fw-semibold">{tab.count}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Search & Info */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
        <div className="position-relative" style={{ minWidth: '300px' }}>
          <span className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></span>
          <input
            className="form-control form-control-sm ps-5 bg-white border-translucent"
            type="search"
            placeholder="Search by product name or vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ borderRadius: '8px' }}
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          {selected.length > 0 && <span className="text-primary fw-semibold fs-9">{selected.length} selected</span>}
          <span className="badge bg-light text-dark border border-translucent px-3 py-2 fw-semibold fs-10">
            {filtered.length} of {products.length} products
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <span className="fas fa-box-open fs-3 text-muted d-block mb-3"></span>
              <h5 className="text-muted fw-semibold">No products found</h5>
              <p className="text-muted fs-10 mb-0">
                {search ? 'Try a different search term' : 'Products will appear here once vendors add them'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3" style={{ width: 40 }}>
                      <input className="form-check-input" type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
                    </th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Product Name</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-end" style={{ width: '130px' }}>Price</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Category</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Vendor</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '80px' }}>Stock</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '120px' }}>Status</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-end" style={{ width: '120px' }}>Published</th>
                    <th className="pe-4 py-3 text-end" style={{ width: '100px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p._id} className={selected.includes(p._id) ? 'table-active' : ''}>
                      <td className="ps-4">
                        <input className="form-check-input" type="checkbox" checked={selected.includes(p._id)} onChange={() => toggleSelect(p._id)} />
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="border border-translucent rounded-2 overflow-hidden flex-shrink-0" style={{ width: 40, height: 40 }}>
                            <img src={p.images?.[0] || '/assets/img/products/60x60/1.png'} alt="" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                          </div>
                          <Link to={`/product/${p._id}`} className="fw-semibold text-primary text-decoration-none line-clamp-1">
                            {p.name}
                          </Link>
                        </div>
                      </td>
                      <td className="text-end fw-bold text-body-emphasis">PKR {p.price?.toLocaleString()}</td>
                      <td>
                        <span className="badge badge-phoenix badge-phoenix-info px-2 py-1 fw-bold fs-10">{p.categoryId?.name || p.categoryId || 'Uncategorized'}</span>
                      </td>
                      <td className="text-muted">{p.vendorId?.businessName || '—'}</td>
                      <td className="text-center">
                        <span className={`fw-bold ${p.stock <= 0 ? 'text-danger' : p.stock <= 10 ? 'text-warning' : 'text-body-emphasis'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${p.isActive ? 'success' : 'secondary'} px-2 py-1 fw-bold fs-10`}>
                          <span className={`fas fa-${p.isActive ? 'check-circle' : 'minus-circle'} me-1`}></span>
                          {p.isActive ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="text-muted text-end fs-10">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <Link to={`/product/${p._id}`} className="btn btn-phoenix-primary btn-xs rounded-circle p-2" title="View">
                            <span className="fas fa-eye"></span>
                          </Link>
                          <button className="btn btn-phoenix-danger btn-xs rounded-circle p-2" title="Delete">
                            <span className="fas fa-trash"></span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}