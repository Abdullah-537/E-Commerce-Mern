import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function CustomerDetail() {
  const { id } = useParams()
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [customerRes, ordersRes, addressesRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/orders?customerId=${id}`),
        api.get(`/users/addresses?userId=${id}`)
      ])
      setCustomer(customerRes.data.data)
      setOrders(ordersRes.data.data || [])
      setAddresses(addressesRes.data.data || [])
    } catch (e) { toast.error('Failed to load customer') }
    setLoading(false)
  }

  const toggleBan = async () => {
    try {
      await api.put(`/users/${id}/ban`, { isActive: !customer?.isActive })
      toast.success(customer?.isActive ? 'Customer banned' : 'Customer unbanned')
      fetchData()
    } catch (e) { toast.error('Failed') }
  }

  const toggleVerify = async () => {
    try {
      await api.put(`/users/${id}/verify`, { isVerified: !customer?.isVerified })
      toast.success(customer?.isVerified ? 'Customer verification removed' : 'Customer verified')
      fetchData()
    } catch (e) { toast.error('Failed to update verification status') }
  }

  const statusColors = { pending: 'warning', processing: 'info', shipped: 'primary', delivered: 'success', cancelled: 'danger' }

  if (loading) return <div className="text-center py-9"><div className="spinner-border text-primary"></div></div>
  if (!customer) return <div className="text-center py-9"><span className="fas fa-user-slash fs-3 text-body-quaternary d-block mb-3"></span><h5 className="text-body-tertiary">Customer not found</h5></div>

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
          <li className="breadcrumb-item"><Link to="/admin/customers">Customers</Link></li>
          <li className="breadcrumb-item active">{customer.name}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <h3 className="text-body-emphasis mb-0">Customer Details</h3>
        <div className="d-flex gap-2">
          <Link to="/admin/customers" className="btn btn-phoenix-secondary btn-sm">
            <span className="fas fa-arrow-left me-1"></span>Back
          </Link>
          <button className={`btn btn-sm ${customer.isVerified ? 'btn-phoenix-warning' : 'btn-phoenix-info'}`} onClick={toggleVerify}>
            <span className={`fas fa-${customer.isVerified ? 'user-times' : 'user-check'} me-1`}></span>
            {customer.isVerified ? 'Remove Verification' : 'Verify Customer'}
          </button>
          <button className={`btn btn-sm ${customer.isActive ? 'btn-phoenix-danger' : 'btn-phoenix-success'}`} onClick={toggleBan}>
            <span className={`fas fa-${customer.isActive ? 'ban' : 'check'} me-1`}></span>
            {customer.isActive ? 'Ban Customer' : 'Unban Customer'}
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Left — Customer Card */}
        <div className="col-12 col-lg-4">
          <div className="card border-translucent h-100">
            <div className="card-body text-center pt-5">
              <div className="avatar avatar-4xl mb-3">
                {customer.avatar ? (
                  <img className="rounded-circle" src={customer.avatar} alt="" style={{ width: 96, height: 96, objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-name rounded-circle bg-primary-subtle text-primary" style={{ width: 96, height: 96, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {customer.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h4 className="text-body-emphasis mb-1">{customer.name}</h4>
              <p className="text-body-tertiary mb-3 fs-9">{customer.email}</p>

              <div className="d-flex justify-content-center gap-2 mb-4">
                <span className={`badge badge-phoenix badge-phoenix-${customer.role === 'admin' ? 'danger' : customer.role === 'vendor' ? 'success' : 'primary'}`}>{customer.role}</span>
                <span className={`badge badge-phoenix badge-phoenix-${customer.isActive ? 'success' : 'danger'}`}>{customer.isActive ? 'Active' : 'Banned'}</span>
                {customer.isVerified && <span className="badge badge-phoenix badge-phoenix-info"><span className="fas fa-check me-1"></span>Verified</span>}
              </div>

              <hr className="border-translucent" />

              <div className="text-start">
                <div className="d-flex justify-content-between py-2">
                  <span className="text-body-tertiary fs-9"><span className="fas fa-phone me-2"></span>Phone</span>
                  <span className="fw-semibold text-body-emphasis fs-9">{customer.phone || '—'}</span>
                </div>
                <div className="d-flex justify-content-between py-2">
                  <span className="text-body-tertiary fs-9"><span className="fas fa-calendar me-2"></span>Joined</span>
                  <span className="fw-semibold text-body-emphasis fs-9">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                </div>
                <div className="d-flex justify-content-between py-2">
                  <span className="text-body-tertiary fs-9"><span className="fas fa-shopping-bag me-2"></span>Orders</span>
                  <span className="fw-bold text-body-emphasis fs-9">{orders.length}</span>
                </div>
                <div className="d-flex justify-content-between py-2">
                  <span className="text-body-tertiary fs-9"><span className="fas fa-money-bill me-2"></span>Total Spent</span>
                  <span className="fw-bold text-success fs-9">PKR {totalSpent.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Orders + Addresses */}
        <div className="col-12 col-lg-8">
          {/* Orders */}
          <div className="card border-translucent mb-4">
            <div className="card-header bg-body-highlight border-bottom border-translucent d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-body-emphasis">
                <span className="fas fa-shopping-bag me-2 text-primary"></span>Orders ({orders.length})
              </h5>
            </div>
            <div className="card-body p-0">
              {orders.length === 0 ? (
                <div className="text-center py-5"><p className="text-body-tertiary mb-0">No orders yet</p></div>
              ) : (
                <div className="table-responsive scrollbar">
                  <table className="table table-hover table-sm fs-9 mb-0">
                    <thead>
                      <tr>
                        <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 ps-3">Order</th>
                        <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end">Total</th>
                        <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Status</th>
                        <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Payment</th>
                        <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end pe-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o._id}>
                          <td className="align-middle ps-3">
                            <Link to={`/admin/orders/${o._id}`} className="fw-semibold text-primary text-decoration-none">#{o._id?.slice(-6).toUpperCase()}</Link>
                          </td>
                          <td className="align-middle text-end fw-bold text-body-emphasis">PKR {o.totalAmount?.toLocaleString()}</td>
                          <td className="align-middle text-center">
                            <span className={`badge badge-phoenix badge-phoenix-${statusColors[o.status] || 'secondary'} fs-10`}>{o.status}</span>
                          </td>
                          <td className="align-middle text-center">
                            <span className={`badge badge-phoenix badge-phoenix-${o.paymentMethod === 'cod' ? 'warning' : 'success'} fs-10`}>{o.paymentMethod === 'cod' ? 'COD' : 'Paid'}</span>
                          </td>
                          <td className="align-middle text-end text-body-tertiary pe-3 fs-10">
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="card border-translucent">
            <div className="card-header bg-body-highlight border-bottom border-translucent">
              <h5 className="mb-0 text-body-emphasis">
                <span className="fas fa-map-marker-alt me-2 text-danger"></span>Addresses ({addresses.length})
              </h5>
            </div>
            <div className="card-body">
              {addresses.length === 0 ? (
                <p className="text-body-tertiary mb-0">No addresses saved</p>
              ) : (
                <div className="row g-3">
                  {addresses.map(a => (
                    <div className="col-12 col-md-6" key={a._id}>
                      <div className="border border-translucent rounded-3 p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-semibold text-body-emphasis">{a.label}</span>
                          {a.isDefault && <span className="badge badge-phoenix badge-phoenix-primary fs-11">Default</span>}
                        </div>
                        <p className="mb-0 text-body-tertiary fs-10">
                          {a.fullName} · {a.phone}<br />
                          {a.street}, {a.city}<br />
                          {a.province} {a.postalCode}, {a.country}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}