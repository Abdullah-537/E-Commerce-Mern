import { useState, useEffect } from 'react'
import api from '../../store/api/baseApi'

export default function Earnings() {
  const [earnings, setEarnings] = useState({ totalEarnings: 0, pendingCommission: 0, settledCommission: 0, history: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vendor/profile').then(res => {
      const v = res.data.data
      setEarnings({ totalEarnings: v.totalEarnings || 0, pendingCommission: 0, settledCommission: v.totalEarnings - (v.availableBalance || 0), history: [] })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h4 className="mb-4">Earnings</h4>
      {loading ? <div className="text-center py-5"><div className="spinner-border"></div></div> : (
        <div className="row g-4 mb-4">
          <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body text-center"><h2>PKR {earnings.totalEarnings.toLocaleString()}</h2><small>Total Earnings</small></div></div></div>
          <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body text-center"><h2>PKR {earnings.settledCommission.toLocaleString()}</h2><small>Received</small></div></div></div>
          <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body text-center"><h2>PKR {earnings.pendingCommission.toLocaleString()}</h2><small>Pending</small></div></div></div>
        </div>
      )}
    </div>
  )
}