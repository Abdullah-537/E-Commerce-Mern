import { useState, useEffect } from 'react'
import api from '../../store/api/baseApi'

export default function Earnings() {
  const [earnings, setEarnings] = useState({ totalEarnings: 0, pendingCommission: 0, settledCommission: 0, history: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vendor/profile').then(res => {
      const v = res.data.data
      api.get(`/vendor/${v._id}/earnings`).then(earningRes => {
        setEarnings({
          totalEarnings: earningRes.data.data.totalEarnings || 0,
          pendingCommission: earningRes.data.data.pendingCommission || 0,
          settledCommission: earningRes.data.data.settledCommission || 0,
          history: earningRes.data.data.history || []
        })
        setLoading(false)
      })
    }).catch(() => setLoading(false))
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
      
      {!loading && earnings.history && earnings.history.length > 0 && (
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0">Earnings History</h5>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Order ID</th>
                  <th>Product(s)</th>
                  <th>Sale Amount</th>
                  <th>Commission</th>
                  <th>Net Earnings</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.history.map((h, i) => (
                  <tr key={i}>
                    <td>#{h.orderId?._id?.slice(-6).toUpperCase() || 'N/A'}</td>
                    <td>
                      {h.orderId?.items?.map((item, idx) => (
                        <div key={idx} className="d-flex align-items-center mb-1">
                          <img src={item.productImage || '/assets/img/products/1.png'} alt="" style={{width: 30, height: 30, objectFit: 'cover'}} className="rounded me-2" />
                          <span className="fs-9 text-truncate" style={{maxWidth: 150}}>{item.productName} (x{item.quantity})</span>
                        </div>
                      ))}
                    </td>
                    <td>PKR {h.grossAmount?.toLocaleString()}</td>
                    <td className="text-danger">- PKR {h.commissionAmount?.toLocaleString()}</td>
                    <td className="text-success fw-bold">PKR {h.netAmount?.toLocaleString()}</td>
                    <td><span className={`badge ${h.status === 'settled' ? 'bg-success' : 'bg-warning'}`}>{h.status}</span></td>
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