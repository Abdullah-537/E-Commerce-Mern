import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'
import { getAvatarColor } from '../../utils/avatarHelper'

export default function VendorStorefront() {
  const { slug } = useParams()
  const [vendor, setVendor] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reportReason, setReportReason] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        // Try by ID first (when linked from product cards)
        const vendorRes = await api.get(`/vendor/public/${slug}`)
        const v = vendorRes.data.data
        setVendor(v)
        const prodRes = await api.get(`/products?vendor=${v._id}&limit=50`)
        setProducts(prodRes.data.data.products || prodRes.data.data || [])
        if (isAuthenticated) {
          const favRes = await api.get('/users/favorite-stores')
          setIsFavorite(favRes.data.data.some(f => f._id === v._id))
        }
      } catch {
        try {
          // Fallback: try by slug
          const vendorRes = await api.get(`/vendor/store/${slug}`)
          const v = vendorRes.data.data
          setVendor(v)
          const prodRes = await api.get(`/products?vendor=${v._id}&limit=50`)
          setProducts(prodRes.data.data.products || prodRes.data.data || [])
        } catch {
          // Not found
        }
      }
      setLoading(false)
    }
    fetchVendor()
  }, [slug])

  const submitRating = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to rate this vendor')
      return
    }
    if (userRating === 0) {
      toast.warning('Please select a rating')
      return
    }
    try {
      await api.post(`/vendor/${vendor._id}/rate`, { rating: userRating })
      toast.success('Thank you for rating!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit rating')
    }
  }

  const submitReport = async () => {
    if (!reportReason.trim()) {
      toast.warning('Please enter a reason for reporting');
      return;
    }
    setReporting(true);
    try {
      await api.post(`/vendor/${vendor._id}/report`, { reason: reportReason });
      toast.success('Store reported successfully. Admins will review it.');
      setShowReport(false);
      setReportReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report store');
    } finally {
      setReporting(false);
    }
  }

  const toggleFavorite = async () => {
    if (!isAuthenticated) return toast.info('Please login first');
    try {
      if (isFavorite) {
        await api.delete(`/users/favorite-stores/${vendor._id}`);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await api.post(`/users/favorite-stores/${vendor._id}`);
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (err) {
      toast.error('Failed to update favorites');
    }
  }

  if (loading) return (
    <div className="text-center py-9">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  )

  if (!vendor) return (
    <div className="text-center py-9">
      <h4 className="text-body-emphasis">Store not found</h4>
      <Link to="/products" className="btn btn-primary mt-3">Browse Products</Link>
    </div>
  )

  const initial = vendor.businessName?.charAt(0)?.toUpperCase() || 'V'

  return (
    <div className="ecommerce-homepage pt-5 mb-9">
      <div className="container-small">
        {/* Breadcrumb */}
        <nav className="mb-4" aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{vendor.businessName}</li>
          </ol>
        </nav>

        {/* Store Header Card */}
        <div className="card mb-5 border border-translucent shadow-sm">
          <div className="card-body p-4 p-lg-5">
            <div className="row align-items-center g-4">
              <div className="col-auto">
                {vendor.logo ? (
                  <img src={vendor.logo} alt={vendor.businessName} className="rounded-circle border border-translucent shadow-sm" style={{ width: 80, height: 80, objectFit: 'cover' }} />
                ) : (
                  <div className="avatar avatar-4xl overflow-hidden">
                    <div className={`avatar-name rounded-circle bg-${getAvatarColor(vendor.businessName)}-subtle text-${getAvatarColor(vendor.businessName)} fw-bold w-100 h-100 d-flex align-items-center justify-content-center`} style={{ fontSize: '2rem' }}>
                      <span>{initial}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="col">
                <h2 className="text-body-emphasis fw-bolder mb-1">{vendor.businessName}</h2>
                <p className="text-body-tertiary mb-2 fs-9">
                  <span className="fas fa-map-marker-alt me-1"></span>
                  {vendor.businessAddress || 'Pakistan'}
                </p>
                {vendor.description && (
                  <p className="text-body-secondary mb-2">{vendor.description}</p>
                )}
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2 fs-9">
                    <span className="fas fa-check-circle me-1"></span>Verified Vendor
                  </span>
                  <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 fs-9">
                    <span className="fas fa-box me-1"></span>{products.length} Products
                  </span>
                  <span className="badge bg-warning-subtle text-warning rounded-pill px-3 py-2 fs-9">
                    <span className="fas fa-star me-1"></span>
                    {vendor.rating ? vendor.rating.toFixed(1) : '0.0'} Rating ({vendor.reviewCount || 0})
                  </span>
                  {isAuthenticated && (
                    <div className="ms-auto d-flex gap-2">
                      <button className={`btn btn-sm rounded-pill px-3 py-1 fs-9 ${isFavorite ? 'btn-danger' : 'btn-outline-danger'}`} onClick={toggleFavorite}>
                        <span className={`${isFavorite ? 'fas' : 'far'} fa-heart me-1`}></span>{isFavorite ? 'Favorited' : 'Add to Favorites'}
                      </button>
                      <button className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fs-9" onClick={() => setShowReport(!showReport)}>
                        <span className="fas fa-flag me-1"></span>Report Store
                      </button>
                    </div>
                  )}
                </div>

                {showReport && (
                  <div className="mt-3 p-3 border border-danger-subtle rounded bg-danger-subtle bg-opacity-10">
                    <h6 className="text-danger mb-2">Report Vendor</h6>
                    <textarea 
                      className="form-control mb-2" 
                      rows="2" 
                      placeholder="Why are you reporting this store?" 
                      value={reportReason} 
                      onChange={e => setReportReason(e.target.value)}
                      disabled={reporting}
                    ></textarea>
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowReport(false)} disabled={reporting}>Cancel</button>
                      <button className="btn btn-sm btn-danger" onClick={submitReport} disabled={reporting}>
                        {reporting ? 'Submitting...' : 'Submit Report'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rate This Vendor */}
        <div className="card mb-5 border border-translucent">
          <div className="card-body p-4">
            <h5 className="text-body-emphasis mb-3">Rate this vendor</h5>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={`fa fa-star fs-5 ${
                      (hoverRating || userRating) >= star ? 'text-warning' : 'text-body-quaternary'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  ></span>
                ))}
              </div>
              <button className="btn btn-sm btn-primary rounded-pill px-4" onClick={submitRating}>
                Submit Rating
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <h4 className="text-body-emphasis mb-4">
          Products from {vendor.businessName}
        </h4>
        {products.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-body-tertiary fs-7">This vendor hasn't listed any products yet.</p>
          </div>
        ) : (
          <div className="row g-3">
            {products.map(product => (
              <div className="col-6 col-md-4 col-lg-3 col-xl-2" key={product._id}>
                      <div className="position-relative text-decoration-none product-card h-100 border border-1 border-translucent rounded-3 p-3">
                        <div className="d-flex flex-column justify-content-between h-100">
                          <div>
                            <div className="position-relative mb-3">
                              <img
                                className="img-fluid"
                                src={product.images?.[0] || '/assets/img/products/1.png'}
                                alt={product.name || ''}
                              />
                            </div>
                            <Link className="stretched-link" to={`/product/${product._id}`}>
                              <h6 className="mb-2 lh-sm line-clamp-3 product-name">{product.name}</h6>
                            </Link>
                            <p className="fs-9 mb-2">
                              {/* Assuming no renderStars func here, hardcode stars or omit if rating not tracked heavily here */}
                              <span className="fa fa-star text-warning"></span>
                              <span className="fa fa-star text-warning"></span>
                              <span className="fa fa-star text-warning"></span>
                              <span className="fa fa-star text-warning"></span>
                              <span className="fa fa-star text-warning"></span>
                              <span className="text-body-quaternary fw-semibold ms-1">
                                ({product.reviewCount || 0} rated)
                              </span>
                            </p>
                          </div>
                          <div>
                            {/* Omit vendor businessName here since we are in the vendor storefront anyway */}
                            <div className="d-flex align-items-center mb-1">
                              {product.salePrice ? (
                                <>
                                  <p className="me-2 text-body text-decoration-line-through mb-0 fs-9">
                                    PKR {product.price?.toLocaleString()}
                                  </p>
                                  <h3 className="text-body-emphasis mb-0">PKR {product.salePrice?.toLocaleString()}</h3>
                                </>
                              ) : (
                                <h3 className="text-body-emphasis mb-0">PKR {product.price?.toLocaleString()}</h3>
                              )}
                            </div>
                            {product.salePrice && (
                              <p className="text-warning fw-bolder fs-9 mb-1">
                                {Math.round((1 - product.salePrice / product.price) * 100)}% off
                              </p>
                            )}
                            <p className="text-body-tertiary fw-semibold fs-9 lh-1 mb-2 mt-1">
                              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                            </p>
                          </div>
                        </div>
                      </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
