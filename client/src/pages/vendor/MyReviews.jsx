import { useState, useEffect } from 'react'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function MyReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchReviews() }, [filter])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/reviews/vendor?filter=${filter}`)
      setReviews(res.data.data || [])
    } catch (e) { toast.error('Failed to load reviews') }
    setLoading(false)
  }

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : 0

  return (
    <div>
      <h4 className="mb-4">My Reviews</h4>
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h2 className="mb-0 text-warning">{avgRating}</h2>
              <div className="text-warning">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</div>
              <p className="text-muted mb-0">{reviews.length} reviews</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-3">
        <div className="btn-group">
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('all')}>All</button>
          <button className={`btn btn-sm ${filter === '5' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('5')}>5 Star</button>
          <button className={`btn btn-sm ${filter === '4' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('4')}>4 Star</button>
          <button className={`btn btn-sm ${filter === '3' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('3')}>3 Star</button>
          <button className={`btn btn-sm ${filter === 'flagged' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('flagged')}>Flagged</button>
        </div>
      </div>
      {loading ? <div className="text-center py-5"><div className="spinner-border"></div></div> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Date</th></tr></thead>
              <tbody>
                {reviews.length === 0 ? <tr><td colSpan={5} className="text-center text-muted py-4">No reviews</td></tr> : reviews.map(r => (
                  <tr key={r._id}>
                    <td><a href={`/products/${r.productId?._id}`} className="text-decoration-none">{r.productId?.name || 'N/A'}</a></td>
                    <td>{r.customerId?.name || 'N/A'}</td>
                    <td><span className="text-warning">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></td>
                    <td><span className="text-truncate d-inline-block" style={{ maxWidth: 250 }}>{r.comment || 'No comment'}</span></td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
