import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { getAvatarColor } from '../../utils/avatarHelper'
export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])

  useEffect(() => {
    api.get('/admin/customers').then(res => setCustomers(res.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(c => c._id))

  return (
    <div className="pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2" style={{ fontSize: '0.8rem' }}>
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none">Admin</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Customers</li>
          </ol>
        </nav>
        <h3 className="text-body-emphasis fw-bold mb-1">Customer Directory</h3>
        <p className="text-muted fs-9 mb-0">Monitor registered user demographics, statuses, verification compliance, and accounts activity.</p>
      </div>

      {/* Toolbar / Search */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
        <div className="position-relative" style={{ minWidth: '300px' }}>
          <span className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></span>
          <input 
            className="form-control form-control-sm ps-5 bg-white border-translucent" 
            type="search" 
            placeholder="Search by name or email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ borderRadius: '8px', paddingHeight: '38px' }}
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          {selected.length > 0 && (
            <span className="text-primary fw-semibold fs-9 me-2">{selected.length} selected</span>
          )}
          <span className="badge bg-light text-dark border border-translucent px-3 py-2 fw-semibold fs-10">
            Total: {filtered.length} Customers
          </span>
        </div>
      </div>

      {/* Directory Card */}
      <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <span className="fas fa-users-slash fs-3 text-muted d-block mb-3"></span>
              <h5 className="text-muted fw-semibold">No customers found</h5>
              <p className="text-muted fs-10 mb-0">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3" style={{ width: 40 }}>
                      <input className="form-check-input" type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
                    </th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Customer</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Email Address</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Phone Number</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '120px' }}>Role</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '150px' }}>Account Status</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-end" style={{ width: '130px' }}>Joined Date</th>
                    <th className="pe-4 py-3 text-end" style={{ width: '120px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c._id} className={selected.includes(c._id) ? 'table-active' : ''}>
                      <td className="ps-4">
                        <input className="form-check-input" type="checkbox" checked={selected.includes(c._id)} onChange={() => toggleSelect(c._id)} />
                      </td>
                      <td>
                        <Link to={`/admin/customers/${c._id}`} className="d-flex align-items-center gap-2 text-decoration-none">
                          <div className="avatar avatar-s overflow-hidden">
                            {c.avatar ? (
                              <img className="rounded-circle w-100 h-100" src={c.avatar} alt="" style={{ objectFit: 'cover' }} />
                            ) : (
                              <div className={`avatar-name rounded-circle bg-${getAvatarColor(c.name)}-subtle text-${getAvatarColor(c.name)} fw-bold w-100 h-100 d-flex align-items-center justify-content-center`}>
                                <span>{c.name?.charAt(0).toUpperCase() || '?'}</span>
                              </div>
                            )}
                          </div>
                          <span className="fw-semibold text-body-emphasis hover-primary">{c.name}</span>
                        </Link>
                      </td>
                      <td className="text-muted">{c.email}</td>
                      <td className="text-muted">{c.phone || '—'}</td>
                      <td className="text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${c.role === 'admin' ? 'danger' : c.role === 'vendor' ? 'success' : 'primary'} px-2 py-1 fw-bold fs-10`}>
                          {c.role}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          {c.isVerified ? (
                            <span className="badge badge-phoenix badge-phoenix-info px-2 py-1 fw-bold fs-10">
                              <span className="fas fa-check-circle me-1"></span>Verified
                            </span>
                          ) : (
                            <span className="badge badge-phoenix badge-phoenix-secondary px-2 py-1 fw-bold fs-10">
                              Unverified
                            </span>
                          )}
                          {!c.isActive && (
                            <span className="badge badge-phoenix badge-phoenix-danger px-2 py-1 fw-bold fs-10">Banned</span>
                          )}
                        </div>
                      </td>
                      <td className="text-muted text-end fs-10">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <Link to={`/admin/customers/${c._id}`} className="btn btn-phoenix-secondary btn-xs rounded-circle p-2" title="View/Edit Profile">
                            <span className="fas fa-eye"></span>
                          </Link>
                          <button 
                            className={`btn btn-xs rounded-circle p-2 ${c.isActive ? 'btn-phoenix-danger' : 'btn-phoenix-success'}`}
                            onClick={async () => {
                              try {
                                await api.put(`/users/${c._id}/ban`, { isActive: !c.isActive })
                                setCustomers(customers.map(x => x._id === c._id ? { ...x, isActive: !c.isActive } : x))
                              } catch (e) {
                                console.error(e)
                              }
                            }}
                            title={c.isActive ? "Ban Account" : "Unban Account"}
                          >
                            <span className={`fas fa-${c.isActive ? 'ban' : 'check'}`}></span>
                          </button>
                        </div>
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