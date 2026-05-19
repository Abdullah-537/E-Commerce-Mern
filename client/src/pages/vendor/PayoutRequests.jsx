import { useState, useEffect } from 'react'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function PayoutRequests() {
  const [payouts, setPayouts] = useState([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/payouts/my-payouts'), api.get('/vendor/profile')])
      .then(([p, v]) => {
        setPayouts(p.data.data)
        setBalance(v.data.data.availableBalance || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const request = async () => {
    try {
      await api.post('/payouts/request')
      toast.success('Payout requested')
      window.location.reload()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    }
  }

  const pending = payouts.filter(p => p.status === 'pending').length

  const getBadgeClass = (status) => {
    if (status === 'paid') return 'bg-success'
    if (status === 'approved') return 'bg-info'
    return 'bg-warning'
  }

  return (
    <div>
      <h4 className="mb-4">Payout Requests</h4>

      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h2>PKR {balance.toLocaleString()}</h2>
              <small>Available Balance</small>
            </div>
          </div>
        </div>
        <div className="col-md-6 d-flex align-items-center justify-content-center">
          <button className="btn btn-success btn-lg" onClick={request} disabled={balance < 500 || pending > 0}>
            Request Payout
            {balance < 500 && <small className="d-block">(Min PKR 500)</small>}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border"></div></div>
      ) : (
        <div className="card border-0 shadow-sm">
          <table className="table mb-0">
            <thead>
              <tr><th>Amount</th><th>Status</th><th>Requested</th><th>Processed</th><th className="text-end pe-3">Actions</th></tr>
            </thead>
            <tbody>
              {payouts.map(p => (
                <tr key={p._id}>
                  <td>PKR {p.amount}</td>
                  <td><span className={`badge ${getBadgeClass(p.status)}`}>{p.status}</span></td>
                  <td>{new Date(p.requestedAt).toLocaleDateString()}</td>
                  <td>{p.processedAt ? new Date(p.processedAt).toLocaleDateString() : '-'}</td>
                  <td className="text-end pe-3">
                    {p.status === 'paid' && (
                      <button className="btn btn-phoenix-secondary btn-sm px-2 py-0 fs-10" onClick={() => toast.info('Invoice coming soon')}>
                        <span className="fas fa-file-invoice me-1"></span>Invoice
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}