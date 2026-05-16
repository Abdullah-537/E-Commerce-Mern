import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function VendorOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [tracking, setTracking] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => { fetchOrder() }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/orders/vendor/${id}`)
      setOrder(res.data.data)
      setTracking(res.data.data?.trackingNumber || '')
    } catch (e) { toast.error('Failed to load order') }
    setLoading(false)
  }

  const markShipped = async () => {
    if (!tracking.trim()) { toast.error('Enter tracking number'); return }
    setUpdating(true)
    try {
      await api.put(`/orders/${id}/fulfillment`, { trackingNumber: tracking, status: 'shipped' })
      toast.success('Order marked as shipped')
      fetchOrder()
    } catch (e) { toast.error('Failed to update') }
    setUpdating(false)
  }

  if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>
  if (!order) return <div className="text-center py-5"><h4>Order not found</h4></div>

  const vendorItems = order.items?.filter(i => i.vendorId?._id === order.vendorId?._id) || []

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
                      <td><div className="d-flex align-items-center gap-2">{item.productImage && <img src={item.productImage} alt="" width={40} height={40} className="rounded" />}<span>{item.productName}</span></div></td>
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
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent"><h5 className="mb-0">Ship Order</h5></div>
              <div className="card-body">
                <div className="d-flex gap-2">
                  <input type="text" className="form-control" placeholder="Enter tracking number" value={tracking} onChange={e => setTracking(e.target.value)} />
                  <button className="btn btn-primary" onClick={markShipped} disabled={updating || order.status === 'shipped'}>{updating ? 'Updating...' : 'Mark as Shipped'}</button>
                </div>
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
            <div className="card-header bg-transparent"><h5 className="mb-0">Customer</h5></div>
            <div className="card-body">
              <p className="mb-1">{order.customerId?.name}</p>
              <p className="mb-0 text-muted">{order.customerId?.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}