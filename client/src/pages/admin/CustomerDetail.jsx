import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'
import { getAvatarColor } from '../../utils/avatarHelper'

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
    <div className="pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2" style={{ fontSize: '0.8rem' }}>
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none">Admin</Link></li>
            <li className="breadcrumb-item"><Link to="/admin/customers" className="text-decoration-none">Customers</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{customer.name}</li>
          </ol>
        </nav>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h3 className="text-body-emphasis fw-bold mb-1">Customer Profile</h3>
            <p className="text-muted fs-9 mb-0">View demographic profile, address book, and purchase orders history.</p>
          </div>
          <div className="d-flex gap-2">
            <button className={`btn btn-sm fw-bold rounded-pill ${customer.isVerified ? 'btn-phoenix-warning' : 'btn-phoenix-info'}`} onClick={toggleVerify}>
              <span className={`fas fa-${customer.isVerified ? 'user-times' : 'user-check'} me-2`}></span>
              {customer.isVerified ? 'Remove Verification' : 'Verify Account'}
            </button>
            <button className={`btn btn-sm fw-bold rounded-pill ${customer.isActive ? 'btn-phoenix-danger' : 'btn-phoenix-success'}`} onClick={toggleBan}>
              <span className={`fas fa-${customer.isActive ? 'ban' : 'check'} me-2`}></span>
              {customer.isActive ? 'Ban Customer' : 'Unban Account'}
            </button>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-12 col-lg-4">
          <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4 text-center">
              <div className="mb-3 position-relative d-inline-block">
                {customer.avatar ? (
                  <img className="rounded-circle border border-2 border-primary p-1 shadow-sm" src={customer.avatar} alt="" style={{ width: 110, height: 110, objectFit: 'cover' }} />
                ) : (
                  <div className={`rounded-circle bg-${getAvatarColor(customer.name)}-subtle text-${getAvatarColor(customer.name)} fw-bold shadow-sm d-flex align-items-center justify-content-center`} style={{ width: 110, height: 110, fontSize: 36, margin: '0 auto', border: `2px solid var(--phoenix-${getAvatarColor(customer.name)})` }}>
                    {customer.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h4 className="fw-bold text-body-emphasis mb-1">{customer.name}</h4>
              <p className="text-muted fs-9 mb-3">{customer.email}</p>

              <div className="d-flex justify-content-center gap-2 mb-4">
                <span className={`badge badge-phoenix badge-phoenix-${customer.role === 'admin' ? 'danger' : customer.role === 'vendor' ? 'success' : 'primary'} px-2 py-1 fw-bold fs-10`}>{customer.role}</span>
                <span className={`badge badge-phoenix badge-phoenix-${customer.isActive ? 'success' : 'danger'} px-2 py-1 fw-bold fs-10`}>{customer.isActive ? 'Active' : 'Banned'}</span>
                {customer.isVerified && <span className="badge badge-phoenix badge-phoenix-info px-2 py-1 fw-bold fs-10"><span className="fas fa-check me-1"></span>Verified</span>}
              </div>

              <hr className="my-3 border-translucent" />

              <div className="text-start fs-9">
                <div className="d-flex justify-content-between py-2 border-bottom border-translucent">
                  <span className="text-muted"><span className="fas fa-phone me-2"></span>Phone Number</span>
                  <span className="fw-semibold text-body-emphasis">{customer.phone || '—'}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom border-translucent">
                  <span className="text-muted"><span className="fas fa-calendar me-2"></span>Account Created</span>
                  <span className="fw-semibold text-body-emphasis">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom border-translucent">
                  <span className="text-muted"><span className="fas fa-shopping-bag me-2"></span>Total Orders</span>
                  <span className="fw-bold text-body-emphasis">{orders.length}</span>
                </div>
                <div className="d-flex justify-content-between py-2">
                  <span className="text-muted"><span className="fas fa-money-bill-wave me-2"></span>Total Spent</span>
                  <span className="fw-bold text-success">PKR {totalSpent.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Orders & Address Book */}
        <div className="col-12 col-lg-8">
          {/* Orders Card */}
          <div className="card border-translucent shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom border-translucent py-3">
              <h5 className="mb-0 text-body-emphasis fw-bold">
                <span className="fas fa-shopping-bag me-2 text-primary"></span>Recent Purchase Orders ({orders.length})
              </h5>
            </div>
            <div className="card-body p-0">
              {orders.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted fs-9 mb-0">No purchase order transactions yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4 py-3 text-muted text-uppercase fw-bold fs-11">Order ID</th>
                        <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-end">Total Paid</th>
                        <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center">Order Status</th>
                        <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center">Method</th>
                        <th className="pe-4 py-3 text-end">Purchase Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o._id}>
                          <td className="ps-4">
                            <Link to={`/admin/orders/${o._id}`} className="fw-bold text-primary text-decoration-none">
                              #{o._id?.slice(-6).toUpperCase()}
                            </Link>
                          </td>
                          <td className="text-end fw-bold text-body-emphasis">PKR {o.totalAmount?.toLocaleString()}</td>
                          <td className="text-center">
                            <span className={`badge badge-phoenix badge-phoenix-${statusColors[o.status] || 'secondary'} px-2 py-1 fw-bold fs-10`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge badge-phoenix badge-phoenix-${o.paymentMethod === 'cod' ? 'warning' : 'success'} px-2 py-1 fw-bold fs-10`}>
                              {o.paymentMethod === 'cod' ? 'COD' : 'Online'}
                            </span>
                          </td>
                          <td className="text-muted text-end pe-4 fs-10">
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

          {/* Address Book Card */}
          <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom border-translucent py-3">
              <h5 className="mb-0 text-body-emphasis fw-bold">
                <span className="fas fa-map-marker-alt me-2 text-danger"></span>Saved Address Book ({addresses.length})
              </h5>
            </div>
            <div className="card-body p-4">
              {addresses.length === 0 ? (
                <p className="text-muted fs-9 mb-0">No shipping addresses cataloged on file.</p>
              ) : (
                <div className="row g-3">
                  {addresses.map(a => (
                    <div className="col-12 col-md-6" key={a._id}>
                      <div className="border border-translucent rounded-3 p-3 bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold text-body-emphasis">{a.label || 'Address'}</span>
                          {a.isDefault && <span className="badge badge-phoenix badge-phoenix-primary px-2 py-0 fw-bold fs-10">Default</span>}
                        </div>
                        <p className="mb-0 text-muted fs-10 lh-base">
                          <strong>{a.fullName}</strong> · {a.phone}<br />
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