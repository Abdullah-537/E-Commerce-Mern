import { useState, useEffect } from 'react'
import api from '../../store/api/baseApi'

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/vendor/orders')
      .then(res => setOrders(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getStatusBadge = (status) => {
    if (status === 'delivered') return 'bg-success'
    if (status === 'cancelled') return 'bg-danger'
    return 'bg-warning'
  }

  return (
    <div>
      <h4 className="mb-4">My Orders</h4>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border"></div></div>
      ) : (
        <div className="card border-0 shadow-sm">
          <table className="table mb-0">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td>{o._id}</td>
                  <td>{o.customerId?.name}</td>
                  <td>{o.items?.length} items</td>
                  <td>PKR {o.totalAmount}</td>
                  <td><span className={`badge ${getStatusBadge(o.status)}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}