import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function Refunds() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/refunds').then(res => setRefunds(res.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const approve = async (id) => {
    try { await api.put(`/refunds/${id}/approve`); setRefunds(refunds.map(r => r._id === id ? { ...r, status: 'approved' } : r)); toast.success('Approved') } catch { toast.error('Failed') }
  }
  const reject = async (id) => {
    try { await api.put(`/refunds/${id}/reject`); setRefunds(refunds.map(r => r._id === id ? { ...r, status: 'rejected' } : r)); toast.success('Rejected') } catch { toast.error('Failed') }
  }

  const filtered = refunds.filter(r => filter === 'all' ? true : r.status === filter)
  const counts = { all: refunds.length, pending: refunds.filter(r => r.status === 'pending').length, approved: refunds.filter(r => r.status === 'approved').length, rejected: refunds.filter(r => r.status === 'rejected').length }
  const statusColors = { pending: 'warning', approved: 'success', rejected: 'danger' }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-1"><li className="breadcrumb-item"><Link to="/admin">Admin</Link></li><li className="breadcrumb-item active">Refunds</li></ol></nav>
          <h3 className="text-body-emphasis mb-0">Refunds</h3>
        </div>
      </div>

      <ul className="nav nav-underline mb-4 fs-9 border-bottom border-translucent">
        {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button className={`nav-link ${filter === tab.key ? 'active fw-semibold' : 'text-body-tertiary'}`} onClick={() => setFilter(tab.key)}>
              {tab.label} <span className="text-body-tertiary fw-semibold ms-1">({counts[tab.key]})</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="card border-translucent">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-7"><div className="spinner-border spinner-border-sm text-primary"></div></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-7"><span className="fas fa-undo fs-3 text-body-quaternary d-block mb-3"></span><h5 className="text-body-tertiary">No refunds found</h5></div>
          ) : (
            <div className="table-responsive scrollbar">
              <table className="table table-hover table-sm fs-9 mb-0">
                <thead>
                  <tr>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 ps-3">Order</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end">Amount</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11">Reason</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Status</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r._id}>
                      <td className="align-middle ps-3 fw-semibold text-primary">#{String(r.orderId).slice(-6).toUpperCase()}</td>
                      <td className="align-middle text-end fw-bold text-body-emphasis">PKR {r.amount?.toLocaleString()}</td>
                      <td className="align-middle text-body-tertiary" style={{ maxWidth: 250 }}><span className="text-truncate d-inline-block" style={{ maxWidth: 250 }}>{r.reason}</span></td>
                      <td className="align-middle text-center"><span className={`badge badge-phoenix badge-phoenix-${statusColors[r.status] || 'secondary'} fs-10`}>{r.status}</span></td>
                      <td className="align-middle text-end pe-3">
                        {r.status === 'pending' && (
                          <div className="d-flex gap-1 justify-content-end">
                            <button className="btn btn-phoenix-success btn-sm px-2 py-0 fs-10" onClick={() => approve(r._id)}><span className="fas fa-check me-1"></span>Approve</button>
                            <button className="btn btn-phoenix-danger btn-sm px-2 py-0 fs-10" onClick={() => reject(r._id)}><span className="fas fa-times me-1"></span>Reject</button>
                          </div>
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