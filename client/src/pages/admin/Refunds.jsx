import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function Refunds() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const [actionRefundId, setActionRefundId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [actionNote, setActionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/refunds').then(res => setRefunds(res.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleAction = async () => {
    if (!actionType || !actionRefundId) return;
    if (actionType === 'reject' && !actionNote.trim()) {
      toast.error('Reason is required for rejection');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/refunds/${actionRefundId}/${actionType}`, { adminNote: actionNote });
      setRefunds(refunds.map(r => r._id === actionRefundId ? { ...r, status: actionType === 'approve' ? 'approved' : 'rejected' } : r));
      toast.success(actionType === 'approve' ? 'Approved' : 'Rejected');
      setActionRefundId(null);
      setActionNote('');
    } catch {
      toast.error('Failed to process request');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = refunds.filter(r => filter === 'all' ? true : r.status === filter)
  const counts = { all: refunds.length, pending: refunds.filter(r => r.status === 'pending').length, approved: refunds.filter(r => r.status === 'approved').length, rejected: refunds.filter(r => r.status === 'rejected').length, refunded: refunds.filter(r => r.status === 'refunded').length }
  const statusColors = { pending: 'warning', approved: 'info', rejected: 'danger', refunded: 'success' }

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2" style={{ fontSize: '0.8rem' }}>
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none">Admin</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Refunds</li>
          </ol>
        </nav>
        <h3 className="text-body-emphasis fw-bold mb-1">Refund Requests</h3>
        <p className="text-muted fs-9 mb-0">Audit, approve, or reject customer product refund claims and payment returns.</p>
      </div>

      {/* Tabs */}
      <ul className="nav nav-underline mb-4 fs-9 border-bottom border-translucent gap-2">
        {[{ key: 'all', label: 'All Claims' }, { key: 'pending', label: 'Pending Review' }, { key: 'approved', label: 'Approved Claims' }, { key: 'refunded', label: 'Returned Payments' }, { key: 'rejected', label: 'Declined claims' }].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button 
              className={`nav-link pb-3 ${filter === tab.key ? 'active fw-bold' : 'text-body-tertiary'}`} 
              onClick={() => setFilter(tab.key)}
              style={{ borderBottomWidth: '3px' }}
            >
              {tab.label} <span className="text-muted fw-semibold ms-1">({counts[tab.key === 'refunded' ? 'refunded' : tab.key === 'declined' ? 'rejected' : tab.key] || 0})</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Action Dialog (Approve / Reject) Inline Card */}
      {actionRefundId && (
        <div className="card border-translucent shadow-sm mb-4" style={{ borderRadius: '12px', borderLeft: '4px solid var(--phoenix-primary)' }}>
          <div className="card-body p-4">
            <h5 className="mb-2 text-body-emphasis fw-bold">
              {actionType === 'approve' ? 'Approve Refund' : 'Reject Refund Claim'}
            </h5>
            <p className="text-muted fs-9 mb-3">
              {actionType === 'approve' ? 'Provide optional processing notes before moving the claim to approved status.' : 'State the reason for rejecting this refund request. This will be visible to other administrators.'}
            </p>
            <textarea
              className="form-control bg-body-highlight border-translucent mb-3 fw-medium"
              rows="3"
              placeholder={actionType === 'approve' ? "Optional approval notes..." : "Rejection explanation (required)..."}
              value={actionNote}
              onChange={e => setActionNote(e.target.value)}
              disabled={submitting}
            ></textarea>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-phoenix-secondary btn-sm fw-bold px-3" onClick={() => setActionRefundId(null)} disabled={submitting}>Cancel</button>
              <button className={`btn btn-sm fw-bold px-4 ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`} onClick={handleAction} disabled={submitting}>
                {submitting ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refunds Card */}
      <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <span className="fas fa-undo fs-3 text-muted d-block mb-3"></span>
              <h5 className="text-muted fw-semibold">No refund request claims found</h5>
              <p className="text-muted fs-10 mb-0">No matching requests exist in this filter view.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3 text-muted text-uppercase fw-bold fs-11" style={{ width: '130px' }}>Order ID</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-end" style={{ width: '150px' }}>Amount</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Claim Reason</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '130px' }}>Status</th>
                    <th className="pe-4 py-3 text-end" style={{ width: '240px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r._id}>
                      <td className="ps-4">
                        <span className="fw-bold text-body-emphasis">
                          #{String(r.orderId).slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="text-end fw-bold text-body-emphasis">PKR {r.amount?.toLocaleString()}</td>
                      <td className="text-muted" style={{ maxWidth: 300 }}>
                        <span className="text-wrap d-block">{r.reason}</span>
                      </td>
                      <td className="text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${statusColors[r.status] || 'secondary'} px-2 py-1 fw-bold fs-10`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        {r.status === 'pending' && (
                          <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-phoenix-success btn-xs fw-bold rounded-pill" onClick={() => {
                              setActionRefundId(r._id);
                              setActionType('approve');
                              setActionNote('');
                            }}>
                              <span className="fas fa-check me-1"></span>Approve
                            </button>
                            <button className="btn btn-phoenix-danger btn-xs fw-bold rounded-pill" onClick={() => {
                              setActionRefundId(r._id);
                              setActionType('reject');
                              setActionNote('');
                            }}>
                              <span className="fas fa-times me-1"></span>Reject
                            </button>
                          </div>
                        )}
                        {r.status === 'approved' && (
                          <button className="btn btn-phoenix-primary btn-xs fw-bold rounded-pill" onClick={() => {
                            api.put(`/refunds/${r._id}/mark-refunded`).then(() => {
                              setRefunds(refunds.map(ref => ref._id === r._id ? { ...ref, status: 'refunded' } : ref));
                              toast.success('Marked as fully refunded');
                            }).catch(err => toast.error(err.response?.data?.message || 'Failed'));
                          }}>
                            <span className="fas fa-money-bill-wave me-1"></span>Mark Refunded
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