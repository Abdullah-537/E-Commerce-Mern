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
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
              <li className="breadcrumb-item active">Products</li>
            </ol>
          </nav>
          <h3 className="text-body-emphasis mb-0">Products</h3>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-phoenix-secondary btn-sm">
            <span className="fas fa-file-export me-1"></span>Export
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <ul className="nav nav-underline mb-4 fs-9 border-bottom border-translucent">
        {[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'active', label: 'Published', count: counts.active },
          { key: 'inactive', label: 'Drafts', count: counts.inactive },
        ].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button
              className={`nav-link ${filter === tab.key ? 'active fw-semibold' : 'text-body-tertiary'}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label} <span className="text-body-tertiary fw-semibold ms-1">({tab.count})</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Search & Filter Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="search-box" style={{ maxWidth: 300 }}>
          <form className="position-relative">
            <input
              className="form-control form-control-sm search-input bg-body-highlight border-translucent ps-6"
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="fas fa-search search-box-icon"></span>
          </form>
        </div>
        <div className="d-flex gap-2">
          <span className="text-body-tertiary fs-10 align-self-center">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card border-translucent">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-7">
              <div className="spinner-border spinner-border-sm text-primary"></div>
              <p className="text-body-tertiary mt-2 mb-0 fs-9">Loading products...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-7">
              <span className="fas fa-box-open fs-3 text-body-quaternary d-block mb-3"></span>
              <h5 className="text-body-tertiary">No products found</h5>
              <p className="text-body-quaternary fs-9 mb-0">
                {search ? 'Try a different search term' : 'Products will appear here once vendors add them'}
              </p>
            </div>
          ) : (
            <div className="table-responsive scrollbar">
              <table className="table table-hover table-sm fs-9 mb-0">
                <thead>
                  <tr>
                    <th className="align-middle ps-3" style={{ width: 30 }}>
                      <input className="form-check-input" type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
                    </th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 ps-2">Product Name</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end">Price</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11">Category</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11">Vendor</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Stock</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Status</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end">Published On</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p._id} className={selected.includes(p._id) ? 'bg-primary bg-opacity-10' : ''}>
                      <td className="align-middle ps-3">
                        <input className="form-check-input" type="checkbox" checked={selected.includes(p._id)} onChange={() => toggleSelect(p._id)} />
                      </td>
                      <td className="align-middle ps-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="border border-translucent rounded-2 overflow-hidden flex-shrink-0" style={{ width: 40, height: 40 }}>
                            <img src={p.images?.[0] || '/assets/img/products/60x60/1.png'} alt="" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                          </div>
                          <Link to={`/products/${p._id}`} className="fw-semibold text-primary text-decoration-none line-clamp-1 fs-9">
                            {p.name}
                          </Link>
                        </div>
                      </td>
                      <td className="align-middle text-end fw-semibold text-body-emphasis">
                        PKR {p.price?.toLocaleString()}
                      </td>
                      <td className="align-middle">
                        <span className="badge badge-phoenix badge-phoenix-info fs-10">{p.category || 'Uncategorized'}</span>
                      </td>
                      <td className="align-middle">
                        <span className="text-body-emphasis fs-9">{p.vendorId?.businessName || '—'}</span>
                      </td>
                      <td className="align-middle text-center">
                        <span className={`fw-semibold ${p.stock <= 0 ? 'text-danger' : p.stock <= 10 ? 'text-warning' : 'text-body-emphasis'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="align-middle text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${p.isActive ? 'success' : 'secondary'} fs-10`}>
                          <span className={`fas fa-${p.isActive ? 'check-circle' : 'minus-circle'} me-1`}></span>
                          {p.isActive ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="align-middle text-end text-body-tertiary pe-3 fs-10">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="align-middle text-end pe-3">
                        <div className="btn-group">
                          <Link to={`/products/${p._id}`} className="btn btn-sm btn-phoenix-primary px-2" title="View">
                            <span className="fas fa-eye"></span>
                          </Link>
                          <button className="btn btn-sm btn-phoenix-danger px-2" title="Delete">
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
        {/* Footer Pagination */}
        {filtered.length > 0 && (
          <div className="card-footer border-top border-translucent d-flex justify-content-between align-items-center">
            <p className="mb-0 text-body-tertiary fs-10">
              {selected.length > 0 && <span className="fw-semibold text-body-emphasis">{selected.length} selected · </span>}
              Showing {filtered.length} of {products.length} products
            </p>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className="page-item disabled"><button className="page-link"><span className="fas fa-chevron-left"></span></button></li>
                <li className="page-item active"><button className="page-link">1</button></li>
                <li className="page-item disabled"><button className="page-link"><span className="fas fa-chevron-right"></span></button></li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}