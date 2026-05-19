import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th className="ps-4">Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td className="ps-4">
                      <Link to={`/vendor/orders/${o._id}`} className="fw-semibold text-decoration-none">
                        #{o._id.slice(-6).toUpperCase()}
                      </Link>
                    </td>
                    <td className="align-middle">{o.customerId?.name}</td>
                    <td className="align-middle">{o.items?.length} items</td>
                    <td className="align-middle">PKR {o.totalAmount}</td>
                    <td className="align-middle"><span className={`badge ${getStatusBadge(o.status)}`}>{o.status}</span></td>
                    <td className="text-end pe-4 align-middle">
                      <Link to={`/vendor/orders/${o._id}`} className="btn btn-sm btn-phoenix-primary">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}