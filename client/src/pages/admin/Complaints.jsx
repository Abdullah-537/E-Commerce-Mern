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
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
              <li className="breadcrumb-item active">Complaints</li>
            </ol>
          </nav>
          <h3 className="text-body-emphasis mb-0">Complaints</h3>
        </div>
      </div>

      <div className="card border-translucent">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-7"><div className="spinner-border spinner-border-sm text-primary"></div></div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-7"><span className="fas fa-check-circle fs-3 text-body-quaternary d-block mb-3"></span><h5 className="text-body-tertiary">No complaints found</h5></div>
          ) : (
            <div className="table-responsive scrollbar">
              <table className="table table-hover table-sm fs-9 mb-0">
                <thead>
                  <tr>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 ps-3">Customer</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11">Vendor</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11">Reason</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Status</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map(c => (
                    <tr key={c._id}>
                      <td className="align-middle ps-3 fw-semibold">{c.customerId?.name || 'N/A'}</td>
                      <td className="align-middle">{c.vendorId?.businessName || 'N/A'}</td>
                      <td className="align-middle text-body-tertiary" style={{ maxWidth: 250 }}><span className="text-wrap d-inline-block" style={{ maxWidth: 250 }}>{c.reason}</span></td>
                      <td className="align-middle text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${c.status === 'pending' ? 'warning' : 'success'} fs-10`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="align-middle text-end pe-3">
                        {c.status === 'pending' && (
                          <button className="btn btn-phoenix-success btn-sm px-2 py-0 fs-10" onClick={() => resolveComplaint(c._id)}>
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
