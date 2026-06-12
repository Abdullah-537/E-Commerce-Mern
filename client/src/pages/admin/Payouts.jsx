import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { getAvatarColor } from '../../utils/avatarHelper'
import { toast } from 'react-toastify'

export default function Payouts() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get(`/payouts${filter !== 'all' ? `?status=${filter}` : ''}`).then(res => setPayouts(res.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [filter])

  const approvePayout = async (id) => {
    try { 
      await api.put(`/payouts/${id}/approve`); 
      setPayouts(payouts.map(p => p._id === id ? { ...p, status: 'approved' } : p)); 
      toast.success('Approved') 
    } catch { toast.error('Failed to approve') }
  }

  const markPaid = async (id) => {
    const ref = prompt('Enter transaction reference:')
    if (!ref) return
    try { await api.put(`/payouts/${id}/mark-paid`, { transactionRef: ref }); setPayouts(payouts.map(p => p._id === id ? { ...p, status: 'paid' } : p)); toast.success('Marked paid') } catch { toast.error('Failed') }
  }

  const filtered = payouts.filter(p => filter === 'all' ? true : p.status === filter)
  const statusColors = { pending: 'warning', approved: 'info', paid: 'success' }

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2" style={{ fontSize: '0.8rem' }}>
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none">Admin</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Payouts</li>
          </ol>
        </nav>
        <h3 className="text-body-emphasis fw-bold mb-1">Store Payouts</h3>
        <p className="text-muted fs-9 mb-0">Authorize, approve, and track payout releases to marketplace store accounts.</p>
      </div>

      {/* Tabs */}
      <ul className="nav nav-underline mb-4 fs-9 border-bottom border-translucent gap-2">
        {[{ key: 'all', label: 'All Payouts' }, { key: 'pending', label: 'Pending Approval' }, { key: 'approved', label: 'Approved Requests' }, { key: 'paid', label: 'Disbursed / Paid' }].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button 
              className={`nav-link pb-3 ${filter === tab.key ? 'active fw-bold' : 'text-body-tertiary'}`} 
              onClick={() => setFilter(tab.key)}
              style={{ borderBottomWidth: '3px' }}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Payouts Card */}
      <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <span className="fas fa-money-bill-wave fs-3 text-muted d-block mb-3"></span>
              <h5 className="text-muted fw-semibold">No payout records found</h5>
              <p className="text-muted fs-10 mb-0">There are no matching payouts in this section.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3 text-muted text-uppercase fw-bold fs-11">Store Details</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-end" style={{ width: '160px' }}>Payout Amount</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '130px' }}>Status</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Requested Date</th>
                    <th className="pe-4 py-3 text-end" style={{ width: '220px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p._id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-3">
                          <div className="avatar avatar-m overflow-hidden">
                            {p.vendorId?.logo ? (
                              <img className="rounded-circle w-100 h-100" src={p.vendorId.logo} alt="" style={{ objectFit: 'cover' }} />
                            ) : (
                              <div className={`avatar-name rounded-circle bg-${getAvatarColor(p.vendorId?.businessName)}-subtle text-${getAvatarColor(p.vendorId?.businessName)} fw-bold w-100 h-100 d-flex align-items-center justify-content-center`}>
                                <span>{p.vendorId?.businessName?.charAt(0).toUpperCase() || 'V'}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold text-body-emphasis">{p.vendorId?.businessName || '—'}</h6>
                            <span className="text-muted fs-10">{p.vendorId?.businessEmail || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-end fw-bold text-body-emphasis">PKR {p.amount?.toLocaleString()}</td>
                      <td className="text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${statusColors[p.status] || 'secondary'} px-2 py-1 fw-bold fs-10`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="text-muted">
                        {p.requestedAt ? new Date(p.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="text-end pe-4">
                        {p.status === 'pending' && (
                          <button className="btn btn-phoenix-info btn-xs fw-bold rounded-pill" onClick={() => approvePayout(p._id)}>
                            <span className="fas fa-check me-1"></span>Approve Payout
                          </button>
                        )}
                        {p.status === 'approved' && (
                          <button className="btn btn-phoenix-success btn-xs fw-bold rounded-pill" onClick={() => markPaid(p._id)}>
                            <span className="fas fa-check-circle me-1"></span>Mark Paid
                          </button>
                        )}
                        {p.status === 'paid' && (
                          <button className="btn btn-phoenix-secondary btn-xs fw-bold rounded-pill" onClick={() => toast.info('Invoice document layout is currently generating')}>
                            <span className="fas fa-file-invoice me-1"></span>Print Invoice
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