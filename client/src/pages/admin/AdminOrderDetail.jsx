import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => { fetchOrder() }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data.data)
    } catch (e) { toast.error('Failed to load order') }
    setLoading(false)
  }

  const updateStatus = async (status) => {
    setUpdating(true)
    try {
      await api.put(`/orders/${id}/status`, { status })
      toast.success('Order status updated')
      fetchOrder()
    } catch (e) { toast.error('Failed to update status') }
    setUpdating(false)
  }

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>
  if (!order) return <div className="text-center py-5"><h4>Order not found</h4></div>

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2" style={{ fontSize: '0.8rem' }}>
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none">Admin</Link></li>
            <li className="breadcrumb-item"><Link to="/admin/orders" className="text-decoration-none">Orders</Link></li>
            <li className="breadcrumb-item active" aria-current="page">#{order._id.slice(-8).toUpperCase()}</li>
          </ol>
        </nav>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <h3 className="text-body-emphasis fw-bold mb-0">Order #{order._id.slice(-8).toUpperCase()}</h3>
            <span className={`badge badge-phoenix badge-phoenix-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : order.status === 'shipped' ? 'primary' : 'warning'} px-3 py-2 fw-bold fs-9`}>
              {order.status}
            </span>
          </div>
          <div className="d-flex gap-2">
            <Link to={`/orders/${id}/invoice`} className="btn btn-phoenix-primary btn-sm fw-bold rounded-pill" target="_blank">
              <span className="fas fa-file-invoice me-2"></span>View Invoice
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column - Items & Fulfillment */}
        <div className="col-12 col-lg-8">
          {/* Order Items Card */}
          <div className="card border-translucent shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom border-translucent py-3">
              <h5 className="mb-0 text-body-emphasis fw-bold">
                <span className="fas fa-box me-2 text-primary"></span>Order Line Items
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4 py-3 text-muted text-uppercase fw-bold fs-11">Product</th>
                      <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-end">Unit Price</th>
                      <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center">Qty</th>
                      <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-end">Line Total</th>
                      <th className="py-3 text-muted text-uppercase fw-bold fs-11">Store</th>
                      <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-end">Commission</th>
                      <th className="pe-4 py-3 text-muted text-uppercase fw-bold fs-11 text-end">Vendor Earns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, i) => (
                      <tr key={i}>
                        <td className="ps-4">
                          <Link to={`/product/${item.productId}`} className="d-flex align-items-center gap-2 text-decoration-none">
                            {item.productImage && <img src={item.productImage} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} className="rounded" />}
                            <span className="text-body-emphasis fw-semibold">{item.productName}</span>
                          </Link>
                        </td>
                        <td className="text-end text-muted">PKR {item.price?.toLocaleString()}</td>
                        <td className="text-center fw-bold">{item.quantity}</td>
                        <td className="text-end fw-bold text-body-emphasis">PKR {(item.price * item.quantity)?.toLocaleString()}</td>
                        <td className="text-muted">{item.vendorId?.businessName || 'N/A'}</td>
                        <td className="text-end text-muted">{item.commissionRate}% <span className="text-danger">(PKR {item.commissionAmount?.toLocaleString()})</span></td>
                        <td className="text-end pe-4 fw-bold text-success">PKR {item.vendorEarning?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Order Totals */}
              <div className="border-top border-translucent p-4">
                <div className="row justify-content-end">
                  <div className="col-12 col-sm-5">
                    <div className="d-flex justify-content-between py-1 fs-9">
                      <span className="text-muted">Subtotal</span>
                      <span className="fw-semibold text-body-emphasis">PKR {order.subtotal?.toLocaleString()}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="d-flex justify-content-between py-1 fs-9">
                        <span className="text-muted">Discount</span>
                        <span className="fw-semibold text-success">-PKR {order.discount?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between py-1 fs-9">
                      <span className="text-muted">Shipping Fee</span>
                      <span className="fw-semibold text-body-emphasis">PKR {order.shippingFee?.toLocaleString()}</span>
                    </div>
                    <hr className="my-2 border-translucent" />
                    <div className="d-flex justify-content-between py-1">
                      <span className="fw-bold text-body-emphasis">Grand Total</span>
                      <span className="fw-bold text-body-emphasis fs-8">PKR {order.totalAmount?.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 fs-9">
                      <span className="text-muted">Platform Commission</span>
                      <span className="fw-bold text-danger">PKR {order.totalCommission?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment Status Card */}
          <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom border-translucent py-3">
              <h5 className="mb-0 text-body-emphasis fw-bold">
                <span className="fas fa-truck-fast me-2 text-primary"></span>Fulfillment Pipeline
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="d-flex flex-column gap-2">
                {[
                  { id: 'pending', label: 'Pending', icon: 'fas fa-clock', color: 'warning' },
                  { id: 'processing', label: 'Processing', icon: 'fas fa-box-open', color: 'info' },
                  { id: 'shipped', label: 'Shipped', icon: 'fas fa-truck', color: 'primary' },
                  { id: 'delivered', label: 'Delivered', icon: 'fas fa-check-circle', color: 'success' },
                  { id: 'cancelled', label: 'Cancelled', icon: 'fas fa-times-circle', color: 'danger' },
                  ...(order.status === 'refund_requested' ? [{ id: 'refund_requested', label: 'Refund Requested', icon: 'fas fa-undo', color: 'warning' }] : []),
                  ...(order.status === 'refund_approved' ? [{ id: 'refund_approved', label: 'Refund Approved', icon: 'fas fa-check', color: 'info' }] : []),
                  ...(order.status === 'refunded' ? [{ id: 'refunded', label: 'Refunded', icon: 'fas fa-money-bill-wave', color: 'danger' }] : []),
                ].map(s => {
                  const isActive = order.status === s.id;
                  const isLocked = ['delivered', 'cancelled', 'refund_requested', 'refund_approved', 'refunded'].includes(order.status);
                  return (
                    <button 
                      key={s.id} 
                      className={`btn d-flex align-items-center justify-content-between px-4 py-3 rounded-3 ${isActive ? `btn-${s.color} text-white shadow-sm` : `btn-outline-${s.color} bg-white`}`}
                      onClick={() => updateStatus(s.id)} 
                      disabled={updating || isActive || (isLocked && !isActive)}
                      style={{ transition: 'all 0.2s' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className={`${s.icon} fs-8`}></span>
                        <span className="fw-bold fs-9">{s.label}</span>
                      </div>
                      {isActive && <span className="fas fa-check-circle fs-9"></span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customer, Address, Payment */}
        <div className="col-12 col-lg-4">
          {/* Customer Card */}
          <div className="card border-translucent shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom border-translucent py-3">
              <h5 className="mb-0 text-body-emphasis fw-bold">
                <span className="fas fa-user me-2 text-info"></span>Customer Info
              </h5>
            </div>
            <div className="card-body p-4 fs-9">
              <div className="d-flex justify-content-between py-2 border-bottom border-translucent">
                <span className="text-muted">Full Name</span>
                <span className="fw-semibold text-body-emphasis">{order.customerId?.name || '—'}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom border-translucent">
                <span className="text-muted">Email</span>
                <span className="fw-semibold text-body-emphasis">{order.customerId?.email || '—'}</span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted">Phone</span>
                <span className="fw-semibold text-body-emphasis">{order.customerId?.phone || '—'}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="card border-translucent shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom border-translucent py-3">
              <h5 className="mb-0 text-body-emphasis fw-bold">
                <span className="fas fa-map-marker-alt me-2 text-danger"></span>Shipping Address
              </h5>
            </div>
            <div className="card-body p-4">
              <p className="mb-0 text-muted fs-9 lh-lg">
                <strong className="text-body-emphasis">{order.addressId?.fullName}</strong><br/>
                {order.addressId?.street}<br/>
                {order.addressId?.city}, {order.addressId?.province}<br/>
                <span className="fas fa-phone me-1"></span>{order.addressId?.phone}
              </p>
            </div>
          </div>

          {/* Payment Card */}
          <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white border-bottom border-translucent py-3">
              <h5 className="mb-0 text-body-emphasis fw-bold">
                <span className="fas fa-credit-card me-2 text-success"></span>Payment Details
              </h5>
            </div>
            <div className="card-body p-4 fs-9">
              <div className="d-flex justify-content-between py-2 border-bottom border-translucent">
                <span className="text-muted">Method</span>
                <span className="fw-bold text-body-emphasis">{order.paymentMethod?.toUpperCase()}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom border-translucent">
                <span className="text-muted">Payment Status</span>
                <span className={`badge badge-phoenix badge-phoenix-${order.paymentStatus === 'paid' ? 'success' : 'warning'} px-2 py-1 fw-bold fs-10`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.trackingNumber && (
                <div className="d-flex justify-content-between py-2 border-bottom border-translucent">
                  <span className="text-muted">Tracking #</span>
                  <span className="fw-semibold text-body-emphasis">{order.trackingNumber}</span>
                </div>
              )}
              {order.notes && (
                <div className="pt-2">
                  <span className="text-muted d-block mb-1">Order Notes</span>
                  <span className="fw-semibold text-body-emphasis">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}