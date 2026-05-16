import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

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
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
              <li className="breadcrumb-item active">Vendors</li>
            </ol>
          </nav>
          <h3 className="text-body-emphasis mb-0">Vendors</h3>
        </div>
      </div>

      {/* Status Tabs */}
      <ul className="nav nav-underline mb-4 fs-9 border-bottom border-translucent">
        {[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'approved', label: 'Approved', count: counts.approved },
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'banned', label: 'Banned', count: counts.banned },
        ].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button className={`nav-link ${filter === tab.key ? 'active fw-semibold' : 'text-body-tertiary'}`} onClick={() => setFilter(tab.key)}>
              {tab.label} <span className="text-body-tertiary fw-semibold ms-1">({tab.count})</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Search Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="search-box" style={{ maxWidth: 300 }}>
          <form className="position-relative">
            <input className="form-control form-control-sm search-input bg-body-highlight border-translucent ps-6" type="search" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} />
            <span className="fas fa-search search-box-icon"></span>
          </form>
        </div>
        <span className="text-body-tertiary fs-10">{filtered.length} vendors</span>
      </div>

      {/* Table */}
      <div className="card border-translucent">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-7"><div className="spinner-border spinner-border-sm text-primary"></div></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-7">
              <span className="fas fa-store fs-3 text-body-quaternary d-block mb-3"></span>
              <h5 className="text-body-tertiary">No vendors found</h5>
            </div>
          ) : (
            <div className="table-responsive scrollbar">
              <table className="table table-hover table-sm fs-9 mb-0">
                <thead>
                  <tr>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 ps-3">Store</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11">Owner</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11">Email</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Commission</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end">Earnings</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Status</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(v => (
                    <tr key={v._id}>
                      <td className="align-middle ps-3">
                        <Link to={`/admin/vendors/${v._id}`} className="d-flex align-items-center gap-2 text-decoration-none">
                          <div className="avatar avatar-s">
                            {v.logo ? (
                              <img className="rounded-circle" src={v.logo} alt="" style={{ width: 32, height: 32, objectFit: 'cover' }} />
                            ) : (
                              <div className="avatar-name rounded-circle bg-success-subtle text-success">
                                <span className="fs-10">{v.businessName?.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="fw-semibold text-body-emphasis d-block">{v.businessName}</span>
                            {v.slug && <span className="text-body-quaternary fs-10">/{v.slug}</span>}
                          </div>
                        </Link>
                      </td>
                      <td className="align-middle text-body-emphasis">{v.userId?.name || '—'}</td>
                      <td className="align-middle text-body-tertiary">{v.businessEmail || v.userId?.email || '—'}</td>
                      <td className="align-middle text-center fw-semibold text-body-emphasis">{v.commissionRate || 10}%</td>
                      <td className="align-middle text-end fw-bold text-body-emphasis">PKR {(v.totalEarnings || 0).toLocaleString()}</td>
                      <td className="align-middle text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${statusColors[v.status] || 'secondary'} fs-10`}>{v.status}</span>
                      </td>
                      <td className="align-middle text-end pe-3">
                        <div className="d-flex gap-1 justify-content-end">
                          {v.status === 'pending' && (
                            <>
                              <button className="btn btn-phoenix-success btn-sm px-2 py-0 fs-10" onClick={() => updateStatus(v._id, 'approved')} title="Approve">
                                <span className="fas fa-check"></span>
                              </button>
                              <button className="btn btn-phoenix-danger btn-sm px-2 py-0 fs-10" onClick={() => updateStatus(v._id, 'banned')} title="Reject">
                                <span className="fas fa-times"></span>
                              </button>
                            </>
                          )}
                          {v.status === 'approved' && (
                            <button className="btn btn-phoenix-danger btn-sm px-2 py-0 fs-10" onClick={() => updateStatus(v._id, 'banned')} title="Ban">
                              <span className="fas fa-ban"></span>
                            </button>
                          )}
                          {v.status === 'banned' && (
                            <button className="btn btn-phoenix-success btn-sm px-2 py-0 fs-10" onClick={() => updateStatus(v._id, 'approved')} title="Unban">
                              <span className="fas fa-undo"></span>
                            </button>
                          )}
                          <Link to={`/admin/vendors/${v._id}`} className="btn btn-phoenix-secondary btn-sm px-2 py-0 fs-10" title="View">
                            <span className="fas fa-eye"></span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="card-footer border-top border-translucent d-flex justify-content-between align-items-center">
            <p className="mb-0 text-body-tertiary fs-10">Showing {filtered.length} of {vendors.length} vendors</p>
            <nav><ul className="pagination pagination-sm mb-0">
              <li className="page-item disabled"><button className="page-link"><span className="fas fa-chevron-left"></span></button></li>
              <li className="page-item active"><button className="page-link">1</button></li>
              <li className="page-item disabled"><button className="page-link"><span className="fas fa-chevron-right"></span></button></li>
            </ul></nav>
          </div>
        )}
      </div>
    </div>
  )
}