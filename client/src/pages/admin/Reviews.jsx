import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'
import { getAvatarColor } from '../../utils/avatarHelper'

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
    <div className="pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2" style={{ fontSize: '0.8rem' }}>
            <li className="breadcrumb-item"><Link to="/admin" className="text-decoration-none">Admin</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Reviews</li>
          </ol>
        </nav>
        <h3 className="text-body-emphasis fw-bold mb-1">Product Reviews</h3>
        <p className="text-muted fs-9 mb-0">Audit, moderate, and action customer testimonials and flagged ratings.</p>
      </div>

      {/* Tabs */}
      <ul className="nav nav-underline mb-4 fs-9 border-bottom border-translucent gap-2">
        {[{ key: 'flagged', label: 'Flagged Reviews' }, { key: 'all', label: 'All Testimonials' }].map(tab => (
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

      {/* Reviews Card */}
      <div className="card border-translucent shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-5">
              <span className="fas fa-star-half-alt fs-3 text-muted d-block mb-3"></span>
              <h5 className="text-muted fw-semibold">No reviews found</h5>
              <p className="text-muted fs-10 mb-0">There are no reviews in this category.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3 text-muted text-uppercase fw-bold fs-11">Product Name</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11" style={{ width: '180px' }}>Customer</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '130px' }}>Rating</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11">Comment</th>
                    <th className="py-3 text-muted text-uppercase fw-bold fs-11 text-center" style={{ width: '130px' }}>Status</th>
                    <th className="pe-4 py-3 text-end" style={{ width: '130px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r._id}>
                      <td className="ps-4">
                        <Link to={`/product/${r.productId?._id}`} className="fw-semibold text-primary text-decoration-none">
                          {r.productId?.name || 'Deleted Product'}
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar avatar-s">
                            <div className={`avatar-name rounded-circle bg-${getAvatarColor(r.customerId?.name)}-subtle text-${getAvatarColor(r.customerId?.name)}`}>
                              <span>{r.customerId?.name?.charAt(0).toUpperCase() || '?'}</span>
                            </div>
                          </div>
                          <span className="text-body-emphasis fw-semibold fs-9">{r.customerId?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="text-center">{renderStars(r.rating)}</td>
                      <td className="text-muted" style={{ maxWidth: 280 }}>
                        <span className="text-wrap d-block">{r.comment}</span>
                      </td>
                      <td className="text-center">
                        <span className={`badge badge-phoenix badge-phoenix-${r.isFlagged ? 'danger' : 'success'} px-2 py-1 fw-bold fs-10`}>
                          <span className={`fas fa-${r.isFlagged ? 'flag' : 'check-circle'} me-1`}></span>
                          {r.isFlagged ? 'Flagged' : 'Active'}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn btn-phoenix-secondary btn-xs rounded-circle p-2" onClick={() => flagReview(r._id, !r.isFlagged)} title={r.isFlagged ? 'Unflag' : 'Flag'}>
                            <span className={`fas fa-${r.isFlagged ? 'undo' : 'flag'}`}></span>
                          </button>
                          <button className="btn btn-phoenix-danger btn-xs rounded-circle p-2" onClick={() => deleteReview(r._id)} title="Delete">
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