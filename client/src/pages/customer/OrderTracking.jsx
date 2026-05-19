import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import AccountSidebar from '../../components/common/AccountSidebar'

export default function OrderTracking() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const steps = [
    { id: 'pending', label: 'Order Placed', icon: 'fas fa-clipboard-list' },
    { id: 'processing', label: 'Processing', icon: 'fas fa-box-open' },
    { id: 'shipped', label: 'Shipped', icon: 'fas fa-truck' },
    { id: 'delivered', label: 'Delivered', icon: 'fas fa-home' }
  ]
  const current = order ? steps.findIndex(s => s.id === order.status) : -1

  if (loading) return (
    <section className="pt-5 pb-9"><div className="container-small"><div className="text-center py-5"><div className="spinner-border text-primary"></div></div></div></section>
  )
  
  if (!order) return (
    <section className="pt-5 pb-9"><div className="container-small"><div className="text-center py-5"><h4>Order not found</h4></div></div></section>
  )

  return (
    <section className="pt-5 pb-9">
      <div className="container-small">
        <nav className="mb-2" aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/orders">My Orders</Link></li>
            <li className="breadcrumb-item active">Order #{order._id.substring(order._id.length - 8).toUpperCase()}</li>
          </ol>
        </nav>

        <div className="row g-4">
          {/* Account Sidebar */}
          <div className="col-12 col-lg-3">
            <AccountSidebar />
          </div>

          {/* Main Content */}
          <div className="col-12 col-lg-9">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-5 gap-3">
              <div>
                <h2 className="text-body-emphasis mb-2">Order Details</h2>
                <p className="text-body-tertiary fs-9 mb-0">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                </p>
              </div>
              <Link to={`/orders/${order._id}/invoice`} className="btn btn-phoenix-secondary btn-sm">
                <span className="fas fa-file-invoice me-2"></span>View Invoice
              </Link>
            </div>

            {/* Tracking Timeline Card */}
            <div className="card border border-translucent shadow-sm mb-4">
              <div className="card-body p-4">
                <h4 className="mb-4">Order Status</h4>
                <div className="position-relative pb-4">
                  <div className="progress position-absolute top-50 start-0 w-100" style={{ height: 4, transform: 'translateY(-50%)', zIndex: 0 }}>
                    <div className="progress-bar bg-primary" role="progressbar" 
                      style={{ width: `${(Math.max(0, current) / (steps.length - 1)) * 100}%` }} 
                      aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  <div className="d-flex justify-content-between position-relative z-1">
                    {steps.map((step, i) => {
                      const isCompleted = i <= current;
                      const isActive = i === current;
                      return (
                        <div key={step.id} className="text-center" style={{ width: '80px' }}>
                          <div 
                            className={`rounded-circle d-inline-flex align-items-center justify-content-center border border-2 ${
                              isCompleted ? 'bg-primary border-primary text-white' : 'bg-white border-translucent text-body-quaternary'
                            }`}
                            style={{ width: 48, height: 48, transition: 'all 0.3s ease', 
                                     boxShadow: isActive ? '0 0 0 4px rgba(44, 123, 229, 0.2)' : 'none' }}
                          >
                            <span className={`${step.icon} fs-8`}></span>
                          </div>
                          <p className={`mt-2 fs-10 fw-bold text-uppercase mb-0 ${isCompleted ? 'text-body-emphasis' : 'text-body-quaternary'}`}>
                            {step.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {order.status === 'shipped' && order.trackingNumber && (
                  <div className="mt-4 p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-25">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary text-white rounded-circle d-flex flex-center" style={{ width: 40, height: 40 }}>
                        <span className="fas fa-truck-fast"></span>
                      </div>
                      <div>
                        <h6 className="mb-1 text-primary">Your order is on the way!</h6>
                        <p className="mb-0 fs-9 text-body-emphasis">Tracking Number: <span className="fw-bold">{order.trackingNumber}</span></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items Card */}
            <div className="card border border-translucent shadow-sm mb-4">
              <div className="card-header bg-body-highlight border-bottom border-translucent py-3 px-4">
                <h5 className="mb-0">Items in this order</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-borderless mb-0 fs-9">
                    <thead className="bg-body-highlight text-body-tertiary border-bottom border-translucent">
                      <tr>
                        <th className="ps-4">Product</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-end">Unit Price</th>
                        <th className="text-end pe-4">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => (
                        <tr key={i} className="border-bottom border-translucent">
                          <td className="ps-4 py-3">
                              <Link to={`/product/${item.productId}`} className="d-flex align-items-center gap-3 text-decoration-none">
                                <div className="border border-translucent rounded-3 p-1 bg-white" style={{ width: 64, height: 64 }}>
                                  <img src={item.productImage || '/assets/img/products/1.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <span className="text-body-emphasis fw-semibold">
                                  {item.productName}
                                </span>
                              </Link>
                          </td>
                          <td className="align-middle text-center fw-semibold">{item.quantity}</td>
                          <td className="align-middle text-end text-body-tertiary">PKR {item.price?.toLocaleString()}</td>
                          <td className="align-middle text-end fw-bold text-body-emphasis pe-4">PKR {(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-footer bg-body-highlight border-top border-translucent py-3 px-4">
                <div className="row justify-content-end">
                  <div className="col-12 col-md-5 col-lg-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-body-tertiary fs-9 fw-semibold">Subtotal</span>
                      <span className="text-body-emphasis fs-9 fw-semibold">PKR {order.totalAmount?.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-body-tertiary fs-9 fw-semibold">Shipping</span>
                      <span className="text-success fs-9 fw-semibold">Free</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between">
                      <span className="text-body-emphasis fw-bold">Total</span>
                      <span className="text-body-emphasis fw-bold fs-7">PKR {order.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping & Payment Info */}
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <div className="card border border-translucent shadow-sm h-100">
                  <div className="card-body p-4">
                    <h5 className="mb-3 d-flex align-items-center gap-2">
                      <span className="fas fa-map-marker-alt text-primary"></span> Shipping Address
                    </h5>
                    <div className="ps-4 border-start border-2 border-primary border-opacity-25 ms-1">
                      <p className="text-body-emphasis fw-semibold mb-1">{order.shippingAddress?.street}</p>
                      <p className="text-body-tertiary mb-1">{order.shippingAddress?.city}, {order.shippingAddress?.province} {order.shippingAddress?.postalCode}</p>
                      {order.shippingAddress?.phone && (
                        <p className="text-body-quaternary fs-9 mb-0 mt-2">
                          <span className="fas fa-phone-alt me-2"></span>{order.shippingAddress.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="card border border-translucent shadow-sm h-100">
                  <div className="card-body p-4">
                    <h5 className="mb-3 d-flex align-items-center gap-2">
                      <span className="fas fa-credit-card text-primary"></span> Payment Method
                    </h5>
                    <div className="ps-4 border-start border-2 border-primary border-opacity-25 ms-1">
                      <p className="text-body-emphasis fw-semibold mb-1 text-uppercase">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                      </p>
                      <p className="text-body-tertiary mb-0 fs-9">Payment Status: <span className={`badge badge-phoenix fs-10 ms-1 ${order.paymentStatus === 'paid' ? 'badge-phoenix-success' : 'badge-phoenix-warning'}`}>{order.paymentStatus}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}