import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function VendorOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [tracking, setTracking] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { user } = useSelector(state => state.auth)

  useEffect(() => { fetchOrder() }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data.data)
      setTracking(res.data.data?.trackingNumber || '')
    } catch (e) { toast.error('Failed to load order') }
    setLoading(false)
  }

  const cancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setUpdating(true)
    try {
      await api.put(`/orders/${id}/status`, { status: 'cancelled' })
      toast.success('Order has been cancelled')
      fetchOrder()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to cancel order') }
    setUpdating(false)
  }

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>
  if (!order) return <div className="text-center py-5"><h4>Order not found</h4></div>

  // Filter items belonging to this vendor
  const vendorItems = order.items?.filter(i => {
    // If populated, vendorId has userId. Match it against the logged-in user._id
    if (i.vendorId?.userId) {
      return i.vendorId.userId.toString() === user?._id?.toString();
    }
    // Fallback if vendorId is just an ID or missing userId
    const itemVendorId = i.vendorId?._id?.toString() || i.vendorId?.toString();
    const myVendorId = user?.vendor?._id?.toString() || user?.vendor?.toString();
    return itemVendorId && myVendorId && itemVendorId === myVendorId;
  }) || []

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Order #{order._id?.slice(-8)}</h4>
        <div className="d-flex gap-2">
          <Link to={`/orders/${id}/invoice`} className="btn btn-primary" target="_blank">
            <span className="fas fa-file-invoice me-2"></span>View Invoice
          </Link>
          <Link to="/vendor/orders" className="btn btn-outline-secondary">Back</Link>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent"><h5 className="mb-0">My Items ({vendorItems.length})</h5></div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th>Earning</th></tr></thead>
                <tbody>
                  {vendorItems.map((item, i) => (
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
                      <td className="text-success">PKR {item.vendorEarning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'shipped' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent"><h5 className="mb-0 text-danger">Cancel Order</h5></div>
              <div className="card-body">
                <p className="text-muted fs-9 mb-3">You can only cancel this order. Only administrators can mark it as shipped.</p>
                <button className="btn btn-danger" onClick={cancelOrder} disabled={updating}>{updating ? 'Cancelling...' : 'Cancel Order'}</button>
              </div>
            </div>
          )}
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent"><h5 className="mb-0">Order Status</h5></div>
            <div className="card-body">
              <span className={`badge ${order.status === 'delivered' ? 'bg-success' : order.status === 'cancelled' ? 'bg-danger' : 'bg-warning'}`}>{order.status}</span>
              {order.trackingNumber && <p className="mt-2 mb-0"><strong>Tracking:</strong> {order.trackingNumber}</p>}
            </div>
          </div>
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent"><h5 className="mb-0">Customer & Shipping</h5></div>
            <div className="card-body">
              <p className="mb-1"><strong>Name:</strong> {order.customerId?.name}</p>
              <p className="mb-2"><strong>Phone:</strong> {order.customerId?.phone}</p>
              <p className="mb-0 fs-9 text-muted">
                {order.addressId?.fullName}<br/>
                {order.addressId?.street}<br/>
                {order.addressId?.city}, {order.addressId?.province}<br/>
                {order.addressId?.phone && <span><i className="fas fa-phone-alt me-1"></i>{order.addressId.phone}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}