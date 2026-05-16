import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function Payouts() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get(`/payouts${filter !== 'all' ? `?status=${filter}` : ''}`).then(res => setPayouts(res.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [filter])

  const markPaid = async (id) => {
    const ref = prompt('Enter transaction reference:')
    if (!ref) return
    try { await api.put(`/payouts/${id}/mark-paid`, { transactionRef: ref }); setPayouts(payouts.map(p => p._id === id ? { ...p, status: 'paid' } : p)); toast.success('Marked paid') } catch { toast.error('Failed') }
  }

  const filtered = payouts.filter(p => filter === 'all' ? true : p.status === filter)
  const statusColors = { pending: 'warning', approved: 'info', paid: 'success' }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-1"><li className="breadcrumb-item"><Link to="/admin">Admin</Link></li><li className="breadcrumb-item active">Payouts</li></ol></nav>
          <h3 className="text-body-emphasis mb-0">Payouts</h3>
        </div>
      </div>

      <ul className="nav nav-underline mb-4 fs-9 border-bottom border-translucent">
        {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }, { key: 'paid', label: 'Paid' }].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button className={`nav-link ${filter === tab.key ? 'active fw-semibold' : 'text-body-tertiary'}`} onClick={() => setFilter(tab.key)}>
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="card border-translucent">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-7"><div className="spinner-border spinner-border-sm text-primary"></div></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-7"><span className="fas fa-money-bill-wave fs-3 text-body-quaternary d-block mb-3"></span><h5 className="text-body-tertiary">No payouts found</h5></div>
          ) : (
            <div className="table-responsive scrollbar">
              <table className="table table-hover table-sm fs-9 mb-0">
                <thead>
                  <tr>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 ps-3">Vendor</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end">Amount</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Status</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11">Requested</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p._id}>
                      <td className="align-middle ps-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-s"><div className="avatar-name rounded-circle bg-success-subtle text-success"><span className="fs-10">{p.vendorId?.businessName?.charAt(0) || 'V'}</span></div></div>
                          <span className="fw-semibold text-body-emphasis">{p.vendorId?.businessName || '—'}</span>
                        </div>
                      </td>
                      <td className="align-middle text-end fw-bold text-body-emphasis">PKR {p.amount?.toLocaleString()}</td>
                      <td className="align-middle text-center"><span className={`badge badge-phoenix badge-phoenix-${statusColors[p.status] || 'secondary'} fs-10`}>{p.status}</span></td>
                      <td className="align-middle text-body-tertiary fs-10">{p.requestedAt ? new Date(p.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                      <td className="align-middle text-end pe-3">
                        {p.status === 'approved' && (
                          <button className="btn btn-phoenix-success btn-sm px-2 py-0 fs-10" onClick={() => markPaid(p._id)}>
                            <span className="fas fa-check-circle me-1"></span>Mark Paid
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
      </div>
    </div>
  )
}