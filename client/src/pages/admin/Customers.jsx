import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'

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
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/admin">Admin</Link></li>
              <li className="breadcrumb-item active">Customers</li>
            </ol>
          </nav>
          <h3 className="text-body-emphasis mb-0">Customers</h3>
        </div>
      </div>

      {/* Search Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="search-box" style={{ maxWidth: 300 }}>
          <form className="position-relative">
            <input className="form-control form-control-sm search-input bg-body-highlight border-translucent ps-6" type="search" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
            <span className="fas fa-search search-box-icon"></span>
          </form>
        </div>
        <span className="text-body-tertiary fs-10">{filtered.length} customers</span>
      </div>

      {/* Table */}
      <div className="card border-translucent">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-7"><div className="spinner-border spinner-border-sm text-primary"></div><p className="text-body-tertiary mt-2 mb-0 fs-9">Loading customers...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-7">
              <span className="fas fa-users fs-3 text-body-quaternary d-block mb-3"></span>
              <h5 className="text-body-tertiary">No customers found</h5>
            </div>
          ) : (
            <div className="table-responsive scrollbar">
              <table className="table table-hover table-sm fs-9 mb-0">
                <thead>
                  <tr>
                    <th className="align-middle ps-3" style={{ width: 30 }}>
                      <input className="form-check-input" type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
                    </th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 ps-2">Customer</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11">Email</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11">Phone</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Role</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Verified</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end">Joined</th>
                    <th className="sort align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c._id} className={selected.includes(c._id) ? 'bg-primary bg-opacity-10' : ''}>
                      <td className="align-middle ps-3">
                        <input className="form-check-input" type="checkbox" checked={selected.includes(c._id)} onChange={() => toggleSelect(c._id)} />
                      </td>
                      <td className="align-middle ps-2">
                        <Link to={`/admin/customers/${c._id}`} className="d-flex align-items-center gap-2 text-decoration-none">
                          <div className="avatar avatar-s">
                            {c.avatar ? (
                              <img className="rounded-circle" src={c.avatar} alt="" style={{ width: 32, height: 32, objectFit: 'cover' }} />
                            ) : (
                              <div className="avatar-name rounded-circle bg-primary-subtle text-primary">
                                <span className="fs-10">{c.name?.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <span className="fw-semibold text-body-emphasis">{c.name}</span>
                        </Link>
                      </td>
                      <td className="align-middle text-body-tertiary">{c.email}</td>
                      <td className="align-middle text-body-tertiary">{c.phone || '—'}</td>
                      <td className="align-middle text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${c.role === 'admin' ? 'danger' : c.role === 'vendor' ? 'success' : 'primary'} fs-10`}>
                          {c.role}
                        </span>
                      </td>
                      <td className="align-middle text-center">
                        {c.isVerified ? (
                          <span className="fas fa-check-circle text-success" title="Verified"></span>
                        ) : (
                          <span className="fas fa-times-circle text-body-quaternary" title="Unverified"></span>
                        )}
                        {!c.isActive && (
                          <span className="badge badge-phoenix badge-phoenix-danger ms-1 fs-11">BANNED</span>
                        )}
                      </td>
                      <td className="align-middle text-end text-body-tertiary fs-10">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="align-middle text-end pe-3">
                        <div className="btn-group">
                          <Link to={`/admin/customers/${c._id}`} className="btn btn-sm btn-phoenix-secondary" title="View/Update">
                            <span className="fas fa-eye"></span>
                          </Link>
                          <button 
                            className={`btn btn-sm ${c.isActive ? 'btn-phoenix-danger' : 'btn-phoenix-success'}`}
                            onClick={async () => {
                              try {
                                await api.put(`/users/${c._id}/ban`, { isActive: !c.isActive })
                                setCustomers(customers.map(x => x._id === c._id ? { ...x, isActive: !c.isActive } : x))
                              } catch (e) {
                                console.error(e)
                              }
                            }}
                            title={c.isActive ? "Deactivate" : "Activate"}
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
        {filtered.length > 0 && (
          <div className="card-footer border-top border-translucent d-flex justify-content-between align-items-center">
            <p className="mb-0 text-body-tertiary fs-10">Showing {filtered.length} customers</p>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className="page-item disabled"><button className="page-link"><span className="fas fa-chevron-left"></span></button></li>
                <li className="page-item active"><button className="page-link">1</button></li>
                <li className="page-item disabled"><button className="page-link"><span className="fas fa-chevron-right"></span></button></li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}