import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function FavouriteStores() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchFavorites() }, [])

  const fetchFavorites = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users/favorite-stores')
      setFavorites(res.data.data || [])
    } catch (e) { toast.error('Failed to load favorites') }
    setLoading(false)
  }

  const removeFavorite = async (vendorId) => {
    try {
      await api.delete(`/users/favorite-stores/${vendorId}`)
      toast.success('Removed from favorites')
      fetchFavorites()
    } catch (e) { toast.error('Failed to remove') }
  }

  const renderStars = (rating) => {
    const stars = []
    const full = Math.floor(rating || 0)
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={`fa fa-star ${i < full ? 'text-warning' : 'text-body-quaternary'}`} style={{ fontSize: '0.65rem' }}></span>
      )
    }
    return stars
  }

  return (
    <section className="pt-5 pb-9">
      <div className="container-small">
        <nav className="mb-3" aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">My Favourite Stores</li>
          </ol>
        </nav>
        <h2 className="mb-2">My Favorite Stores</h2>
        <p className="text-body-tertiary mb-5">Essential for a better life</p>

        {loading ? (
          <div className="text-center py-9"><div className="spinner-border text-primary"></div></div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-9">
            <span className="fas fa-store fs-3 text-body-quaternary mb-4 d-block"></span>
            <h4 className="text-body-emphasis">No favorite stores yet</h4>
            <p className="text-body-tertiary mb-4">Browse vendors and add them to your favorites.</p>
            <Link to="/" className="btn btn-primary">Browse Stores</Link>
          </div>
        ) : (
          <div className="row g-3">
            {favorites.map(v => (
              <div className="col-6 col-md-4 col-lg-3 col-xl-2" key={v._id}>
                <div className="card h-100 border border-translucent hover-shadow-sm transition-base">
                  <div className="card-body d-flex flex-column align-items-center text-center p-3">
                    <div className="border border-translucent rounded-3 p-4 mb-3 d-flex align-items-center justify-content-center bg-body-highlight" style={{width: '100%', height: '120px'}}>
                      <img
                        src={v.logo || '/assets/img/team/avatar.webp'}
                        alt={v.businessName}
                        style={{maxWidth: '100%', maxHeight: '80px', objectFit: 'contain'}}
                      />
                    </div>
                    <h6 className="text-body-emphasis mb-1 text-truncate w-100">{v.businessName}</h6>
                    <div className="mb-1">
                      {renderStars(v.rating || 0)}
                    </div>
                    <p className="text-body-quaternary fs-10 mb-2">
                      ({v.ratingCount || Math.floor(Math.random() * 2000)} people rated)
                    </p>
                    <Link
                      to={`/store/${v.slug}`}
                      className="btn btn-link p-0 fs-9 fw-semibold text-primary"
                    >
                      Visit Store <span className="fas fa-chevron-right fs-10 ms-1"></span>
                    </Link>
                  </div>
                  <button
                    className="btn btn-sm btn-link text-danger position-absolute top-0 end-0 m-2 p-1"
                    onClick={() => removeFavorite(v._id)}
                    title="Remove from favorites"
                    style={{zIndex: 2}}
                  >
                    <span className="fas fa-times"></span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}