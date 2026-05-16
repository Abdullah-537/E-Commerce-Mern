import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'

export default function AllOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState([])

  useEffect(() => {
    api.get('/admin/orders').then(res => setOrders(res.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statusColors = {
    pending: 'warning', processing: 'info', shipped: 'primary',
    delivered: 'success', cancelled: 'danger', refunded: 'secondary'
  }

  const filtered = orders.filter(o => {
    const matchSearch = o._id?.toLowerCase().includes(search.toLowerCase()) ||
                        o.userId?.name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true : o.status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(o => o._id))

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
              <li className="breadcrumb-item active">Orders</li>
            </ol>
          </nav>
          <h3 className="text-body-emphasis mb-0">Orders</h3>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-phoenix-secondary btn-sm">
            <span className="fas fa-file-export me-1"></span>Export
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <ul className="nav nav-underline mb-4 fs-9 border-bottom border-translucent flex-nowrap overflow-auto scrollbar">
        {[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'processing', label: 'Processing', count: counts.processing },
          { key: 'shipped', label: 'Shipped', count: counts.shipped },
          { key: 'delivered', label: 'Delivered', count: counts.delivered },
          { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
        ].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button
              className={`nav-link text-nowrap ${filter === tab.key ? 'active fw-semibold' : 'text-body-tertiary'}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label} <span className="text-body-tertiary fw-semibold ms-1">({tab.count})</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Search Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="search-box" style={{ maxWidth: 300 }}>
          <form className="position-relative">
            <input className="form-control form-control-sm search-input bg-body-highlight border-translucent ps-6" type="search" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
            <span className="fas fa-search search-box-icon"></span>
          </form>
        </div>
        <span className="text-body-tertiary fs-10">{filtered.length} orders</span>
      </div>

      {/* Table */}
      <div className="card border-translucent">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-7"><div className="spinner-border spinner-border-sm text-primary"></div><p className="text-body-tertiary mt-2 mb-0 fs-9">Loading orders...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-7">
              <span className="fas fa-shopping-bag fs-3 text-body-quaternary d-block mb-3"></span>
              <h5 className="text-body-tertiary">No orders found</h5>
            </div>
          ) : (
            <div className="table-responsive scrollbar">
              <table className="table table-hover table-sm fs-9 mb-0">
                <thead>
                  <tr>
                    <th className="align-middle ps-3" style={{ width: 30 }}>
                      <input className="form-check-input" type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
                    </th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11">Order</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11">Customer</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11">Date</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Items</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end">Total</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Payment</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Status</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end pe-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o._id} className={selected.includes(o._id) ? 'bg-primary bg-opacity-10' : ''}>
                      <td className="align-middle ps-3">
                        <input className="form-check-input" type="checkbox" checked={selected.includes(o._id)} onChange={() => toggleSelect(o._id)} />
                      </td>
                      <td className="align-middle">
                        <Link to={`/admin/orders/${o._id}`} className="fw-semibold text-primary text-decoration-none">
                          #{o._id?.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-s">
                            <div className="avatar-name rounded-circle bg-primary-subtle text-primary">
                              <span className="fs-10">{o.userId?.name?.charAt(0).toUpperCase() || '?'}</span>
                            </div>
                          </div>
                          <span className="text-body-emphasis fw-semibold fs-9">{o.userId?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="align-middle text-body-tertiary fs-10">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="align-middle text-center text-body-emphasis">
                        {o.items?.length || 0}
                      </td>
                      <td className="align-middle text-end fw-bold text-body-emphasis">
                        PKR {o.totalAmount?.toLocaleString()}
                      </td>
                      <td className="align-middle text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${o.paymentMethod === 'cod' ? 'warning' : 'success'} fs-10`}>
                          {o.paymentMethod === 'cod' ? 'COD' : 'Paid'}
                        </span>
                      </td>
                      <td className="align-middle text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${statusColors[o.status] || 'secondary'} fs-10`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="align-middle text-end pe-3">
                        <Link to={`/admin/orders/${o._id}`} className="btn btn-phoenix-secondary btn-sm px-2 py-0">
                          <span className="fas fa-eye fs-10"></span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="card-footer border-top border-translucent d-flex justify-content-between align-items-center">
            <p className="mb-0 text-body-tertiary fs-10">
              {selected.length > 0 && <span className="fw-semibold text-body-emphasis">{selected.length} selected · </span>}
              Showing {filtered.length} of {orders.length} orders
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