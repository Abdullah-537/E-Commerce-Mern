import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('flagged')

  useEffect(() => { fetchReviews() }, [filter])

  const fetchReviews = async () => {
    setLoading(true)
    try { const res = await api.get(`/reviews?flagged=${filter === 'flagged'}`); setReviews(res.data.data || []) } catch { }
    setLoading(false)
  }

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return
    try { await api.delete(`/reviews/${id}`); toast.success('Deleted'); fetchReviews() } catch { toast.error('Failed') }
  }

  const flagReview = async (id, flagged) => {
    try { await api.put(`/reviews/${id}`, { isFlagged: flagged }); toast.success(flagged ? 'Flagged' : 'Unflagged'); fetchReviews() } catch { toast.error('Failed') }
  }

  const renderStars = (rating) => (
    <div className="d-flex gap-0">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`fas fa-star fs-10 ${i <= rating ? 'text-warning' : 'text-body-quaternary'}`}></span>
      ))}
    </div>
  )

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-1"><li className="breadcrumb-item"><Link to="/admin">Admin</Link></li><li className="breadcrumb-item active">Reviews</li></ol></nav>
          <h3 className="text-body-emphasis mb-0">Reviews</h3>
        </div>
      </div>

      <ul className="nav nav-underline mb-4 fs-9 border-bottom border-translucent">
        {[{ key: 'flagged', label: 'Flagged' }, { key: 'all', label: 'All Reviews' }].map(tab => (
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
          ) : reviews.length === 0 ? (
            <div className="text-center py-7"><span className="fas fa-star-half-alt fs-3 text-body-quaternary d-block mb-3"></span><h5 className="text-body-tertiary">No reviews found</h5></div>
          ) : (
            <div className="table-responsive scrollbar">
              <table className="table table-hover table-sm fs-9 mb-0">
                <thead>
                  <tr>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 ps-3">Product</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11">Customer</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Rating</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11">Comment</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-center">Status</th>
                    <th className="align-middle text-uppercase text-body-tertiary fw-bold fs-11 text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r._id}>
                      <td className="align-middle ps-3">
                        <Link to={`/products/${r.productId?._id}`} className="fw-semibold text-primary text-decoration-none">{r.productId?.name || 'N/A'}</Link>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-s"><div className="avatar-name rounded-circle bg-primary-subtle text-primary"><span className="fs-10">{r.customerId?.name?.charAt(0) || '?'}</span></div></div>
                          <span className="text-body-emphasis fs-9">{r.customerId?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="align-middle text-center">{renderStars(r.rating)}</td>
                      <td className="align-middle"><span className="text-body-tertiary text-truncate d-inline-block" style={{ maxWidth: 250 }}>{r.comment}</span></td>
                      <td className="align-middle text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${r.isFlagged ? 'danger' : 'success'} fs-10`}>
                          <span className={`fas fa-${r.isFlagged ? 'flag' : 'check-circle'} me-1`}></span>
                          {r.isFlagged ? 'Flagged' : 'Active'}
                        </span>
                      </td>
                      <td className="align-middle text-end pe-3">
                        <div className="d-flex gap-1 justify-content-end">
                          <button className="btn btn-phoenix-secondary btn-sm px-2 py-0 fs-10" onClick={() => flagReview(r._id, !r.isFlagged)} title={r.isFlagged ? 'Unflag' : 'Flag'}>
                            <span className={`fas fa-${r.isFlagged ? 'undo' : 'flag'}`}></span>
                          </button>
                          <button className="btn btn-phoenix-danger btn-sm px-2 py-0 fs-10" onClick={() => deleteReview(r._id)} title="Delete">
                            <span className="fas fa-trash"></span>
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