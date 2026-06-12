import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../store/api/baseApi'
import AccountSidebar from '../../components/common/AccountSidebar'

export default function CustomerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refundOrderId, setRefundOrderId] = useState(null)
  const [refundReason, setRefundReason] = useState('')
  const [submittingRefund, setSubmittingRefund] = useState(false)

  useEffect(() => {
    api.get('/orders/my-orders')
      .then(res => setOrders(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getStatusBadge = (status) => {
    switch(status) {
      case 'delivered': return <span className="badge badge-phoenix badge-phoenix-success">Delivered</span>
      case 'shipped': return <span className="badge badge-phoenix badge-phoenix-primary">Shipped</span>
      case 'processing': return <span className="badge badge-phoenix badge-phoenix-info">Processing</span>
      case 'cancelled': return <span className="badge badge-phoenix badge-phoenix-danger">Cancelled</span>
      case 'refunded': return <span className="badge badge-phoenix badge-phoenix-danger">Refunded</span>
      case 'refund_requested': return <span className="badge badge-phoenix badge-phoenix-warning">Refund Requested</span>
      case 'refund_approved': return <span className="badge badge-phoenix badge-phoenix-info">Refund Approved</span>
      default: return <span className="badge badge-phoenix badge-phoenix-warning">Pending</span>
    }
  }

  return (
    <section className="pt-5 pb-9 bg-body flex-1">
      <div className="container-small">
        <nav className="mb-2" aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active">My Orders</li>
          </ol>
        </nav>

        <div className="row g-4">
          {/* Account Sidebar */}
          <div className="col-12 col-lg-3">
            <AccountSidebar />
          </div>

          {/* Main Content */}
          <div className="col-12 col-lg-9">
            <div className="mb-5">
              <h2 className="text-body-emphasis">My Orders</h2>
              <p className="text-body-tertiary">Track, return, or buy items again</p>
            </div>

            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
            ) : orders.length === 0 ? (
              <div className="card border border-translucent shadow-sm">
                <div className="card-body text-center py-6">
                  <span className="fas fa-shopping-bag fs-3 text-body-quaternary mb-3 d-block"></span>
                  <h4 className="text-body-emphasis">No orders yet</h4>
                  <p className="text-body-tertiary mb-4">You haven't placed any orders yet. Start exploring our products!</p>
                  <Link to="/products" className="btn btn-primary btn-sm">Start Shopping</Link>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-4">
                {orders.map(order => (
                  <div key={order._id} className="card border border-translucent shadow-sm overflow-hidden">
                    {/* Order Header */}
                    <div className="card-header bg-body-highlight border-bottom border-translucent d-flex flex-wrap justify-content-between align-items-center p-4">
                      <div className="d-flex gap-5">
                        <div>
                          <p className="fs-10 text-body-tertiary fw-bold text-uppercase mb-1">Order Placed</p>
                          <p className="fs-9 text-body-emphasis fw-semibold mb-0">
                            {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p className="fs-10 text-body-tertiary fw-bold text-uppercase mb-1">Total</p>
                          <p className="fs-9 text-body-emphasis fw-semibold mb-0">PKR {order.totalAmount?.toLocaleString()}</p>
                        </div>
                        <div className="d-none d-sm-block">
                          <p className="fs-10 text-body-tertiary fw-bold text-uppercase mb-1">Ship To</p>
                          <p className="fs-9 text-body-emphasis fw-semibold mb-0 line-clamp-1">
                            {order.shippingAddress?.city}, {order.shippingAddress?.province}
                          </p>
                        </div>
                      </div>
                      <div className="text-end mt-3 mt-sm-0">
                        <p className="fs-10 text-body-tertiary fw-bold text-uppercase mb-1">Order # {order._id.substring(order._id.length - 8).toUpperCase()}</p>
                        <div className="d-flex gap-2 justify-content-end">
                          <Link to={`/orders/${order._id}/track`} className="text-primary fs-9 fw-semibold text-decoration-none">View Details</Link>
                          <span className="text-body-quaternary">|</span>
                          <Link to={`/orders/${order._id}/invoice`} className="text-primary fs-9 fw-semibold text-decoration-none">Invoice</Link>
                        </div>
                      </div>
                    </div>
                    
                    {/* Order Body */}
                    <div className="card-body p-4">
                      <div className="mb-4 d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-1 text-body-emphasis">Status: {getStatusBadge(order.status)}</h5>
                          {order.status === 'shipped' && order.trackingNumber && (
                            <p className="fs-9 text-body-tertiary mb-0">Tracking: <span className="fw-semibold text-body-emphasis">{order.trackingNumber}</span></p>
                          )}
                        </div>
                        {order.status === 'delivered' && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => {
                            setRefundOrderId(order._id);
                            setRefundReason('');
                          }}>Request Refund</button>
                        )}
                      </div>

                      {refundOrderId === order._id && (
                        <div className="mb-4 p-3 border border-danger rounded bg-danger-subtle">
                          <h6 className="text-danger mb-2">Request Refund</h6>
                          <textarea 
                            className="form-control mb-2" 
                            rows="2" 
                            placeholder="Please enter a reason for the refund request..."
                            value={refundReason}
                            onChange={e => setRefundReason(e.target.value)}
                            disabled={submittingRefund}
                          ></textarea>
                          <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setRefundOrderId(null)} disabled={submittingRefund}>Cancel</button>
                            <button className="btn btn-sm btn-danger" onClick={() => {
                              if (!refundReason.trim()) {
                                toast.error('Please enter a reason');
                                return;
                              }
                              setSubmittingRefund(true);
                              api.post('/refunds', { orderId: order._id, reason: refundReason })
                                .then(() => {
                                  toast.success("Refund requested successfully");
                                  setRefundOrderId(null);
                                  // Update order status locally to 'refund_requested'
                                  setOrders(orders.map(o => o._id === order._id ? { ...o, status: 'refund_requested' } : o));
                                })
                                .catch(err => toast.error(err.response?.data?.message || "Failed to request refund"))
                                .finally(() => setSubmittingRefund(false));
                            }} disabled={submittingRefund}>
                              {submittingRefund ? 'Submitting...' : 'Submit Request'}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="d-flex flex-column gap-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="d-flex align-items-center gap-3">
                            <Link to={`/product/${item.productId}`} className="d-flex align-items-center gap-3 text-decoration-none flex-1">
                              <div className="border border-translucent rounded-3 p-1" style={{ width: 80, height: 80, background: 'var(--phoenix-body-highlight-bg)' }}>
                                <img src={item.productImage || '/assets/img/products/1.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </div>
                              <div className="flex-1">
                                <span className="text-body-emphasis fw-semibold d-block mb-1">
                                  {item.productName}
                                </span>
                                <p className="fs-9 text-body-tertiary mb-1">Quantity: {item.quantity}</p>
                                <p className="fs-9 fw-bold text-body-emphasis mb-0">PKR {item.price?.toLocaleString()}</p>
                              </div>
                            </Link>
                            <div className="d-none d-sm-block">
                              <button className="btn btn-phoenix-secondary btn-sm px-3">Buy it again</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
