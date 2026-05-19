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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Order #{order._id.slice(-8)}</h4>
        <div className="d-flex gap-2">
          <Link to={`/orders/${id}/invoice`} className="btn btn-primary" target="_blank">
            <span className="fas fa-file-invoice me-2"></span>View Invoice
          </Link>
          <Link to="/admin/orders" className="btn btn-outline-secondary">Back</Link>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Order Items</h5>
              <span className={`badge ${order.status === 'delivered' ? 'bg-success' : order.status === 'cancelled' ? 'bg-danger' : 'bg-warning'}`}>{order.status}</span>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th>Vendor</th><th>Commission</th><th>Vendor Earns</th></tr></thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <Link to={`/product/${item.productId}`} className="d-flex align-items-center gap-2 text-decoration-none">
                          {item.productImage && <img src={item.productImage} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} className="rounded" />}
                          <span className="text-body-emphasis fw-semibold">{item.productName}</span>
                        </Link>
                      </td>
                      <td>PKR {item.price}</td>
                      <td>{item.quantity}</td>
                      <td>PKR {item.price * item.quantity}</td>
                      <td>{item.vendorId?.businessName || 'N/A'}</td>
                      <td>{item.commissionRate}% (PKR {item.commissionAmount})</td>
                      <td>PKR {item.vendorEarning}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={3}><strong>Subtotal</strong></td><td colSpan={4}>PKR {order.subtotal}</td></tr>
                  {order.discount > 0 && <tr><td colSpan={3}>Discount</td><td colSpan={4} className="text-success">-PKR {order.discount}</td></tr>}
                  <tr><td colSpan={3}>Shipping</td><td colSpan={4}>PKR {order.shippingFee}</td></tr>
                  <tr><td colSpan={3}><strong>Total</strong></td><td colSpan={4}><strong>PKR {order.totalAmount}</strong></td></tr>
                  <tr><td colSpan={3}>Total Commission</td><td colSpan={4}>PKR {order.totalCommission}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-bottom-0 pt-4 pb-0">
              <h5 className="mb-0 text-body-emphasis"><span className="fas fa-truck-fast me-2 text-primary"></span>Fulfillment Status</h5>
            </div>
            <div className="card-body">
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
                      className={`btn btn-sm d-flex align-items-center justify-content-between px-3 py-2 ${isActive ? `btn-${s.color} text-white` : `btn-outline-${s.color} bg-white`}`}
                      onClick={() => updateStatus(s.id)} 
                      disabled={updating || isActive || (isLocked && !isActive)}
                      style={{ transition: 'all 0.2s' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className={`${s.icon} fs-9`}></span>
                        <span className="fw-semibold fs-9">{s.label}</span>
                      </div>
                      {isActive && <span className="fas fa-check fs-9"></span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent"><h5 className="mb-0">Customer</h5></div>
            <div className="card-body">
              <p className="mb-1"><strong>Name:</strong> {order.customerId?.name}</p>
              <p className="mb-1"><strong>Email:</strong> {order.customerId?.email}</p>
              <p className="mb-0"><strong>Phone:</strong> {order.customerId?.phone}</p>
            </div>
          </div>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent"><h5 className="mb-0">Shipping Address</h5></div>
            <div className="card-body">
              <p className="mb-0">{order.addressId?.fullName}<br/>{order.addressId?.street}<br/>{order.addressId?.city}, {order.addressId?.province}<br/>{order.addressId?.phone}</p>
            </div>
          </div>
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent"><h5 className="mb-0">Payment</h5></div>
            <div className="card-body">
              <p className="mb-1"><strong>Method:</strong> {order.paymentMethod?.toUpperCase()}</p>
              <p className="mb-1"><strong>Status:</strong> <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-success' : 'bg-warning'}`}>{order.paymentStatus}</span></p>
              {order.trackingNumber && <p className="mb-0"><strong>Tracking:</strong> {order.trackingNumber}</p>}
              {order.notes && <p className="mb-0"><strong>Notes:</strong> {order.notes}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}