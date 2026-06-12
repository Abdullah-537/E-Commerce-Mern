import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { getAvatarColor } from '../../utils/avatarHelper'

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
    <div className="pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2" style={{ fontSize: '0.8rem' }}>
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none">Admin</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Orders</li>
          </ol>
        </nav>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h3 className="text-body-emphasis fw-bold mb-1">Order Management</h3>
            <p className="text-muted fs-9 mb-0">Track, filter, and manage all marketplace purchase transactions.</p>
          </div>
          <button className="btn btn-phoenix-secondary btn-sm fw-bold rounded-pill">
            <span className="fas fa-file-export me-2"></span>Export CSV
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <ul className="nav nav-underline mb-4 fs-9 border-bottom border-translucent flex-nowrap overflow-auto gap-1">
        {[
          { key: 'all', label: 'All Orders', count: counts.all },
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'processing', label: 'Processing', count: counts.processing },
          { key: 'shipped', label: 'Shipped', count: counts.shipped },
          { key: 'delivered', label: 'Delivered', count: counts.delivered },
          { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
        ].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button
              className={`nav-link text-nowrap pb-3 ${filter === tab.key ? 'active fw-bold' : 'text-body-tertiary'}`}
              onClick={() => setFilter(tab.key)}
              style={{ borderBottomWidth: '3px' }}
            >
              {tab.label} <span className="badge bg-light text-dark ms-1 fw-semibold">{tab.count}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Search & Info Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
        <div className="position-relative" style={{ minWidth: '300px' }}>
          <span className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></span>
          <input 
            className="form-control form-control-sm ps-5 bg-white border-translucent" 
            type="search" 
            placeholder="Search by order ID or customer name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ borderRadius: '8px' }}
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          {selected.length > 0 && <span className="text-primary fw-semibold fs-9">{selected.length} selected</span>}
          <span className="badge bg-light text-dark border border-translucent px-3 py-2 fw-semibold fs-10">
            {filtered.length} of {orders.length} orders
          </span>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <span className="fas fa-shopping-bag fs-3 text-muted d-block mb-3"></span>
              <h5 className="text-muted fw-semibold">No orders found</h5>
              <p className="text-muted fs-10 mb-0">Try adjusting your filters or search.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3" style={{ width: 40 }}>
                      <input className="form-check-input" type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
                    </th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Order ID</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Customer</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Date</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '80px' }}>Items</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-end" style={{ width: '140px' }}>Total</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '120px' }}>Payment</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '130px' }}>Status</th>
                    <th className="pe-4 py-3 text-end" style={{ width: '100px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o._id} className={selected.includes(o._id) ? 'table-active' : ''}>
                      <td className="ps-4">
                        <input className="form-check-input" type="checkbox" checked={selected.includes(o._id)} onChange={() => toggleSelect(o._id)} />
                      </td>
                      <td>
                        <Link to={`/admin/orders/${o._id}`} className="fw-bold text-primary text-decoration-none">
                          #{o._id?.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-s overflow-hidden">
                            <div className={`avatar-name rounded-circle bg-${getAvatarColor(o.customerId?.name)}-subtle text-${getAvatarColor(o.customerId?.name)} fw-bold w-100 h-100 d-flex align-items-center justify-content-center`}>
                              <span>{o.customerId?.name?.charAt(0).toUpperCase() || '?'}</span>
                            </div>
                          </div>
                          {o.customerId ? (
                            <Link to={`/admin/customers/${o.customerId._id}`} className="text-body-emphasis fw-semibold text-decoration-none hover-primary">
                              {o.customerId.name}
                            </Link>
                          ) : (
                            <span className="text-body-emphasis fw-semibold">Unknown</span>
                          )}
                        </div>
                      </td>
                      <td className="text-muted fs-10">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="text-center fw-bold">{o.items?.length || 0}</td>
                      <td className="text-end fw-bold text-body-emphasis">PKR {o.totalAmount?.toLocaleString()}</td>
                      <td className="text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${o.paymentMethod === 'cod' ? 'warning' : 'success'} px-2 py-1 fw-bold fs-10`}>
                          {o.paymentMethod === 'cod' ? 'COD' : 'Paid'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${statusColors[o.status] || 'secondary'} px-2 py-1 fw-bold fs-10`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <Link to={`/admin/orders/${o._id}`} className="btn btn-phoenix-primary btn-xs rounded-circle p-2" title="View Order">
                            <span className="fas fa-eye"></span>
                          </Link>
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