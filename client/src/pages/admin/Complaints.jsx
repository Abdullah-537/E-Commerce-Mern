import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/admin/complaints')
      setComplaints(res.data.data || [])
    } catch {
      toast.error('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  const resolveComplaint = async (id) => {
    try {
      await api.put(`/admin/complaints/${id}/resolve`)
      setComplaints(complaints.map(c => c._id === id ? { ...c, status: 'resolved' } : c))
      toast.success('Complaint resolved')
    } catch {
      toast.error('Failed to resolve complaint')
    }
  }

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2" style={{ fontSize: '0.8rem' }}>
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none">Admin</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Complaints</li>
          </ol>
        </nav>
        <h3 className="text-body-emphasis fw-bold mb-1">Customer Complaints</h3>
        <p className="text-muted fs-9 mb-0">Track, review, and mark customer complaints against vendor stores as resolved.</p>
      </div>

      <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-5">
              <span className="fas fa-check-circle fs-3 text-success d-block mb-3"></span>
              <h5 className="text-muted fw-semibold mb-0">All complaints are resolved!</h5>
              <p className="text-muted fs-10 mb-0">Everything is running smoothly on the marketplace.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3 text-muted text-uppercase fw-bold fs-11">Customer</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Reported Store</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Reason / Details</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '130px' }}>Status</th>
                    <th className="pe-4 py-3 text-end" style={{ width: '120px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map(c => (
                    <tr key={c._id}>
                      <td className="ps-4 fw-semibold text-body-emphasis">
                        {c.customerId?.name || 'Guest Customer'}
                      </td>
                      <td className="fw-semibold text-body-emphasis">{c.vendorId?.businessName || 'N/A'}</td>
                      <td className="text-muted" style={{ maxWidth: 300 }}>
                        <span className="text-wrap d-block">{c.reason}</span>
                      </td>
                      <td className="text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${c.status === 'pending' ? 'warning' : 'success'} px-2 py-1 fw-bold fs-10`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        {c.status === 'pending' && (
                          <button className="btn btn-phoenix-success btn-xs fw-bold rounded-pill" onClick={() => resolveComplaint(c._id)}>
                            <span className="fas fa-check me-1"></span>Resolve
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
