import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { getAvatarColor } from '../../utils/avatarHelper'
import { toast } from 'react-toastify'

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [rejectingVendorId, setRejectingVendorId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/vendor').then(res => setVendors(res.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id, status) => {
    try {
      const endpoint = status === 'approved' ? `/vendor/${id}/approve` : `/vendor/${id}/ban`
      await api.put(endpoint, {})
      setVendors(vendors.map(v => v._id === id ? { ...v, status } : v))
      toast.success(`Vendor ${status}`)
    } catch (err) { toast.error('Update failed') }
  }

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      toast.warning('Please provide a reason for rejection')
      return
    }
    setSubmitting(true)
    try {
      await api.put(`/vendor/${id}/reject`, { reason: rejectReason })
      setVendors(vendors.map(v => v._id === id ? { ...v, status: 'rejected' } : v))
      toast.success('Vendor rejected')
      setRejectingVendorId(null)
      setRejectReason('')
    } catch (err) {
      toast.error('Rejection failed')
    } finally {
      setSubmitting(false)
    }
  }

  const counts = {
    all: vendors.length,
    approved: vendors.filter(v => v.status === 'approved').length,
    pending: vendors.filter(v => v.status === 'pending').length,
    banned: vendors.filter(v => v.status === 'banned').length,
  }

  const filtered = vendors.filter(v => {
    const matchSearch = v.businessName?.toLowerCase().includes(search.toLowerCase()) ||
                        v.userId?.name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true : v.status === filter
    return matchSearch && matchFilter
  })

  const statusColors = { approved: 'success', pending: 'warning', rejected: 'danger', banned: 'danger' }

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2" style={{ fontSize: '0.8rem' }}>
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none">Admin</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Vendors</li>
          </ol>
        </nav>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h3 className="text-body-emphasis fw-bold mb-1">Vendor Management</h3>
            <p className="text-muted fs-9 mb-0">Review, approve, and manage marketplace sellers and store operations.</p>
          </div>
          <button className="btn btn-phoenix-secondary btn-sm fw-bold rounded-pill">
            <span className="fas fa-file-export me-2"></span>Export CSV
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <ul className="nav nav-underline mb-4 fs-9 border-bottom border-translucent gap-1">
        {[
          { key: 'all', label: 'All Vendors', count: counts.all },
          { key: 'approved', label: 'Approved', count: counts.approved },
          { key: 'pending', label: 'Pending Approval', count: counts.pending },
          { key: 'banned', label: 'Suspended', count: counts.banned },
        ].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button
              className={`nav-link pb-3 ${filter === tab.key ? 'active fw-bold' : 'text-body-tertiary'}`}
              onClick={() => setFilter(tab.key)}
              style={{ borderBottomWidth: '3px' }}
            >
              {tab.label} <span className="badge bg-light text-dark ms-1 fw-semibold">{tab.count}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Search & Info */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
        <div className="position-relative" style={{ minWidth: '300px' }}>
          <span className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></span>
          <input
            className="form-control form-control-sm ps-5 bg-white border-translucent"
            type="search"
            placeholder="Search by store name or owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ borderRadius: '8px' }}
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark border border-translucent px-3 py-2 fw-semibold fs-10">
            {filtered.length} of {vendors.length} vendors
          </span>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <span className="fas fa-store fs-3 text-muted d-block mb-3"></span>
              <h5 className="text-muted fw-semibold">No vendors found</h5>
              <p className="text-muted fs-10 mb-0">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3 text-muted text-uppercase fw-bold fs-11">Store Details</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Owner Info</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '120px' }}>Commission</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-end" style={{ width: '140px' }}>Total Earnings</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '120px' }}>Status</th>
                    <th className="pe-4 py-3 text-end" style={{ width: '160px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <React.Fragment key={v._id}>
                      <tr>
                        <td className="ps-4">
                          <Link to={`/admin/vendors/${v._id}`} className="d-flex align-items-center gap-3 text-decoration-none">
                            <div className="avatar avatar-m overflow-hidden">
                              {v.logo ? (
                                <img className="rounded-circle border border-translucent shadow-sm w-100 h-100" src={v.logo} alt="" style={{ objectFit: 'cover' }} />
                              ) : (
                                <div className={`avatar-name rounded-circle bg-${getAvatarColor(v.businessName)}-subtle text-${getAvatarColor(v.businessName)} fw-bold w-100 h-100 d-flex align-items-center justify-content-center`}>
                                  <span>{v.businessName?.charAt(0).toUpperCase() || 'V'}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="fw-semibold text-body-emphasis d-block mb-1">{v.businessName}</span>
                              <span className="text-muted fs-10">{v.slug || ''}</span>
                            </div>
                          </Link>
                        </td>
                        <td>
                          <div>
                            <span className="fw-semibold text-body-emphasis d-block mb-1">{v.userId?.name || '—'}</span>
                            <span className="text-muted fs-10 d-flex align-items-center gap-1">
                              <span className="fas fa-envelope"></span> {v.businessEmail || v.userId?.email || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="badge badge-phoenix badge-phoenix-info px-2 py-1 fw-bold fs-10">{v.commissionRate || 10}%</span>
                        </td>
                        <td className="text-end fw-bold text-success">PKR {(v.totalEarnings || 0).toLocaleString()}</td>
                        <td className="text-center">
                          <span className={`badge badge-phoenix badge-phoenix-${statusColors[v.status] || 'secondary'} px-2 py-1 fw-bold fs-10`}>
                            {v.status === 'banned' ? 'Suspended' : v.status}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex gap-2 justify-content-end">
                            {v.status === 'pending' && (
                              <>
                                <button className="btn btn-phoenix-success btn-xs rounded-circle p-2" onClick={() => updateStatus(v._id, 'approved')} title="Approve">
                                  <span className="fas fa-check"></span>
                                </button>
                                <button className="btn btn-phoenix-danger btn-xs rounded-circle p-2" onClick={() => setRejectingVendorId(v._id)} title="Reject">
                                  <span className="fas fa-times"></span>
                                </button>
                              </>
                            )}
                            {v.status === 'approved' && (
                              <button className="btn btn-phoenix-danger btn-xs rounded-circle p-2" onClick={() => updateStatus(v._id, 'banned')} title="Suspend Store">
                                <span className="fas fa-ban"></span>
                              </button>
                            )}
                            {v.status === 'banned' && (
                              <button className="btn btn-phoenix-success btn-xs rounded-circle p-2" onClick={() => updateStatus(v._id, 'approved')} title="Reinstate Store">
                                <span className="fas fa-undo"></span>
                              </button>
                            )}
                            <Link to={`/admin/vendors/${v._id}`} className="btn btn-phoenix-primary btn-xs rounded-circle p-2" title="View Store">
                              <span className="fas fa-eye"></span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                      {rejectingVendorId === v._id && (
                        <tr key={`reject-${v._id}`} className="bg-body-highlight">
                          <td colSpan={6} className="px-4 py-3 border-bottom border-translucent">
                            <div className="d-flex align-items-center gap-3">
                              <span className="fas fa-exclamation-circle text-danger fs-8"></span>
                              <div className="flex-grow-1">
                                <input
                                  type="text"
                                  className="form-control form-control-sm bg-white border-translucent"
                                  placeholder="Provide a detailed reason for rejecting this vendor application (will be emailed)..."
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  disabled={submitting}
                                  style={{ borderRadius: '6px' }}
                                />
                              </div>
                              <button className="btn btn-sm btn-phoenix-secondary fw-bold px-3" onClick={() => { setRejectingVendorId(null); setRejectReason(''); }} disabled={submitting}>Cancel</button>
                              <button className="btn btn-sm btn-danger fw-bold px-4" onClick={() => handleReject(v._id)} disabled={submitting}>
                                {submitting ? <span className="spinner-border spinner-border-sm"></span> : 'Confirm Rejection'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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