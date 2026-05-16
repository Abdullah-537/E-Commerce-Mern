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
                        <div className="d-flex align-items-center gap-2">
                          {item.productImage && <img src={item.productImage} alt="" width={40} height={40} className="rounded" />}
                          <span>{item.productName}</span>
                        </div>
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
            <div className="card-header bg-transparent"><h5 className="mb-0">Update Status</h5></div>
            <div className="card-body">
              <div className="btn-group">
                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                  <button key={s} className={`btn btn-sm ${order.status === s ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => updateStatus(s)} disabled={updating || order.status === s}>{s}</button>
                ))}
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