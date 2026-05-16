import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function MyProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, published, draft

  useEffect(() => {
    fetchProducts()
  }, [filter])

  const fetchProducts = () => {
    setLoading(true)
    const params = filter !== 'all' ? `?status=${filter}` : ''
    api.get(`/products/my-products${params}`)
      .then(res => setProducts(res.data.data))
      .catch((err) => { console.error(err); toast.error('Failed to load products') })
      .finally(() => setLoading(false))
  }

  const toggleActive = async (id, current) => {
    try {
      await api.put(`/products/${id}`, { isActive: !current })
      setProducts(products.map(p => p._id === id ? { ...p, isActive: !current } : p))
      toast.success('Updated')
    } catch (e) {
      toast.error('Failed')
    }
  }

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await api.delete(`/products/${id}`)
      setProducts(products.filter(p => p._id !== id))
      toast.success('Product deleted')
    } catch (e) {
      toast.error('Failed to delete')
    }
  }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="mb-1 text-body-emphasis">My Products</h3>
          <p className="text-body-tertiary fs-9 mb-0">Manage your product listings</p>
        </div>
        <Link to="/vendor/products/add" className="btn btn-primary">
          <span className="fas fa-plus me-1"></span> Add Product
        </Link>
      </div>

      {/* Filter Tabs */}
      <ul className="nav nav-underline mb-4 fs-9">
        {[
          { key: 'all', label: 'All Products' },
          { key: 'published', label: 'Published' },
          { key: 'draft', label: 'Drafts' },
        ].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button
              className={`nav-link ${filter === tab.key ? 'active' : 'text-body-tertiary'}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : products.length === 0 ? (
        <div className="text-center py-5">
          <span className="fas fa-box-open fs-3 text-body-quaternary d-block mb-3"></span>
          <h5 className="text-body-tertiary">No products found</h5>
          <p className="text-body-quaternary mb-3">Start adding products to your store</p>
          <Link to="/vendor/products/add" className="btn btn-sm btn-primary">Add Your First Product</Link>
        </div>
      ) : (
        <div className="card border border-translucent">
          <div className="table-responsive">
            <table className="table table-hover mb-0 fs-9">
              <thead>
                <tr>
                  <th className="text-body-tertiary ps-3" style={{ width: 60 }}>Image</th>
                  <th className="text-body-tertiary">Product Name</th>
                  <th className="text-body-tertiary">Category</th>
                  <th className="text-body-tertiary">Price</th>
                  <th className="text-body-tertiary">Stock</th>
                  <th className="text-body-tertiary">Status</th>
                  <th className="text-body-tertiary text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td className="ps-3">
                      <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', background: 'var(--phoenix-body-highlight-bg)' }}>
                        <img
                          src={p.images?.[0] || '/assets/img/products/60x60/1.png'}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </td>
                    <td>
                      <h6 className="mb-0 text-body-emphasis fs-9">{p.name}</h6>
                      {p.slug && <small className="text-body-quaternary">{p.slug}</small>}
                    </td>
                    <td className="text-body-tertiary">{p.categoryId?.name || '—'}</td>
                    <td>
                      <span className="fw-semibold text-body-emphasis">PKR {p.price?.toLocaleString()}</span>
                      {p.salePrice && (
                        <small className="d-block text-success">Sale: PKR {p.salePrice.toLocaleString()}</small>
                      )}
                    </td>
                    <td>
                      <span className={`fw-semibold ${p.stock <= 5 ? 'text-danger' : 'text-body-emphasis'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      {p.status === 'draft' ? (
                        <span className="badge badge-phoenix badge-phoenix-warning fs-10">Draft</span>
                      ) : p.isActive ? (
                        <span className="badge badge-phoenix badge-phoenix-success fs-10">Active</span>
                      ) : (
                        <span className="badge badge-phoenix badge-phoenix-secondary fs-10">Inactive</span>
                      )}
                    </td>
                    <td className="text-end pe-3">
                      <div className="d-flex justify-content-end gap-1">
                        <Link to={`/vendor/products/edit/${p._id}`} className="btn btn-sm btn-phoenix-primary py-0 px-2" title="Edit">
                          <span className="fas fa-edit fs-10"></span>
                        </Link>
                        <button className="btn btn-sm btn-phoenix-secondary py-0 px-2" onClick={() => toggleActive(p._id, p.isActive)} title={p.isActive ? 'Deactivate' : 'Activate'}>
                          <span className={`fas fa-${p.isActive ? 'eye-slash' : 'eye'} fs-10`}></span>
                        </button>
                        <button className="btn btn-sm btn-phoenix-danger py-0 px-2" onClick={() => deleteProduct(p._id)} title="Delete">
                          <span className="fas fa-trash-alt fs-10"></span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}