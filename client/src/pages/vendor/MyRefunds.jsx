import { useState, useEffect } from 'react'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function MyRefunds() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRefunds() }, [])

  const fetchRefunds = async () => {
    setLoading(true)
    try {
      const res = await api.get('/refunds/vendor')
      setRefunds(res.data.data || [])
    } catch (e) { toast.error('Failed to load refunds') }
    setLoading(false)
  }

  return (
    <div>
      <h4 className="mb-4">My Refunds</h4>
      {loading ? <div className="text-center py-5"><div className="spinner-border"></div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Order ID</th><th>Customer</th><th>Reason</th><th>Amount</th><th>Status</th><th>Requested</th></tr></thead>
              <tbody>
                {refunds.length === 0 ? <tr><td colSpan={6} className="text-center text-muted py-4">No refunds</td></tr> : refunds.map(r => (
                  <tr key={r._id}>
                    <td><a href={`/vendor/orders/${r.orderId?._id}`} className="text-decoration-none">{r.orderId?._id?.slice(-8) || 'N/A'}</a></td>
                    <td>{r.customerId?.name || 'N/A'}</td>
                    <td><span className="text-truncate d-inline-block" style={{ maxWidth: 200 }}>{r.reason}</span></td>
                    <td>PKR {r.amount}</td>
                    <td><span className={`badge ${r.status === 'approved' ? 'bg-success' : r.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>{r.status}</span></td>
                    <td>{new Date(r.requestedAt).toLocaleDateString()}</td>
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