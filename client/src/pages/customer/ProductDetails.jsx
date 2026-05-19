import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCart } from '../../store/slices/cartSlice'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function ProductDetails() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedImg, setSelectedImg] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState({})
  const [activeTab, setActiveTab] = useState('description')
  const [similarProducts, setSimilarProducts] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  
  const [reviews, setReviews] = useState([])
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  useEffect(() => {
    setLoading(true)
    api.get(`/products/${id}`)
      .then(res => {
        const p = res.data.data
        setProduct(p)
        // Initialize first variant option as selected for each group
        if (p.variants?.length) {
          const initial = {}
          const groups = {}
          p.variants.forEach(v => {
            if (!groups[v.name]) groups[v.name] = []
            groups[v.name].push(v)
          })
          Object.keys(groups).forEach(g => { initial[g] = groups[g][0]?.value })
          setSelectedVariants(initial)
        }
        if (p.categoryId?._id || p.categoryId) {
          const catId = p.categoryId?._id || p.categoryId
          api.get(`/products?category=${catId}&limit=8`)
            .then(r => {
              const all = r.data.data.products || r.data.data || []
              setSimilarProducts(all.filter(x => x._id !== p._id).slice(0, 6))
            })
            .catch(() => {})
        }
        if (p._id) {
          api.get(`/products/${p._id}/reviews`)
            .then(r => setReviews(r.data.data))
            .catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (similarProducts.length === 0) return
    const timer = setTimeout(() => {
      document.querySelectorAll('.swiper-theme-container').forEach(container => {
        if (!window.Swiper || !container) return
        const swiperEl = container.querySelector('[data-swiper]')
        if (!swiperEl) return
        if (swiperEl.swiper) { try { swiperEl.swiper.destroy(true, true) } catch (e) {} }
        let config = {}
        try { config = JSON.parse(swiperEl.getAttribute('data-swiper') || '{}') } catch (e) {}
        const nav = container.querySelector('.swiper-nav')
        new window.Swiper(swiperEl, {
          ...config,
          observer: true,
          observeParents: true,
          watchOverflow: true,
          navigation: {
            nextEl: nav?.querySelector('.swiper-button-next'),
            prevEl: nav?.querySelector('.swiper-button-prev'),
          },
        })
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [similarProducts])

  const addToCart = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to cart')
      return navigate('/login', { state: { from: location } })
    }
    try {
      await api.post('/cart', { productId: id, quantity })
      const { data } = await api.get('/cart')
      dispatch(setCart(data.data))
      toast.success('Added to cart')
    } catch (err) {
      toast.error('Failed to add to cart')
    }
  }

  const [isWishlisted, setIsWishlisted] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      api.get('/wishlist').then(res => {
        const items = res.data.data?.items?.map(i => i.productId?._id || i.productId) || []
        setIsWishlisted(items.includes(id))
      }).catch(() => {})
    }
  }, [isAuthenticated, user, id])

  const addToWishlist = async () => {
    if (!isAuthenticated) {
      toast.info('Please login first')
      return navigate('/login', { state: { from: location } })
    }
    setWishlistLoading(true)
    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/${id}`)
        setIsWishlisted(false)
        toast.success('Removed from wishlist')
      } else {
        await api.post('/wishlist', { productId: id })
        setIsWishlisted(true)
        toast.success('Added to wishlist')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update wishlist')
    } finally {
      setWishlistLoading(false)
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) return toast.info('Please login first')
    if (userRating === 0) return toast.error('Please select a rating')
    
    setReviewLoading(true)
    try {
      const { data } = await api.post(`/products/${id}/reviews`, { rating: userRating, comment })
      toast.success(data.message || 'Review added')
      setReviews([data.data, ...reviews])
      setUserRating(0)
      setComment('')
      // refresh product stats
      const pRes = await api.get(`/products/${id}`)
      setProduct(pRes.data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review')
    } finally {
      setReviewLoading(false)
    }
  }

  const renderStars = (rating) => {
    const stars = []
    const full = Math.floor(rating)
    const half = rating % 1 >= 0.5
    for (let i = 0; i < full; i++) stars.push(<span key={`f${i}`} className="fa fa-star text-warning"></span>)
    if (half) stars.push(<span key="h" className="fa fa-star-half-alt text-warning"></span>)
    const empty = 5 - full - (half ? 1 : 0)
    for (let i = 0; i < empty; i++) stars.push(<span key={`e${i}`} className="far fa-star text-body-quaternary"></span>)
    return stars
  }

  if (loading) return (
    <div className="text-center py-9">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  )
  if (!product) return (
    <div className="text-center py-9">
      <h4 className="text-body-emphasis">Product not found</h4>
      <Link to="/products" className="btn btn-primary mt-3">Browse Products</Link>
    </div>
  )

  const price = product.salePrice || product.price
  const hasDiscount = product.salePrice && product.salePrice < product.price
  const discountPct = hasDiscount ? Math.round((1 - product.salePrice / product.price) * 100) : 0
  // Group variants by name (e.g. Color, Size)
  const variantGroups = {}
  const variantImages = []
  if (product.variants?.length) {
    product.variants.forEach(v => {
      if (!variantGroups[v.name]) variantGroups[v.name] = []
      variantGroups[v.name].push(v)
      if (v.image && !variantImages.includes(v.image)) {
        variantImages.push(v.image)
      }
    })
  }

  const baseImages = product.images?.length ? product.images : []
  const allImages = [...baseImages, ...variantImages.filter(img => !baseImages.includes(img))]
  const images = allImages.length ? allImages : ['/assets/img/products/1.png']

  const handleVariantSelect = (groupName, value, image) => {
    setSelectedVariants(prev => ({ ...prev, [groupName]: value }))
    if (image) {
      const idx = images.indexOf(image)
      if (idx !== -1) {
        setSelectedImg(idx)
      }
    }
  }

  const handleImageSelect = (idx) => {
    setSelectedImg(idx)
    const selectedImageSrc = images[idx]
    if (product.variants?.length) {
      const variant = product.variants.find(v => v.image === selectedImageSrc)
      if (variant) {
        setSelectedVariants(prev => ({ ...prev, [variant.name]: variant.value }))
      }
    }
  }

  return (
    <div className="pt-5 pb-9">
      {/* Product Hero Section */}
      <section className="py-0">
        <div className="container-small">
          <nav className="mb-3" aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 flex-wrap">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
              {product.categoryId?.name && (
                <li className="breadcrumb-item">
                  <Link to={`/products?category=${product.categoryId._id}`}>{product.categoryId.name}</Link>
                </li>
              )}
              <li className="breadcrumb-item active text-truncate" style={{ maxWidth: 200 }} aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>

          {/* ── Main product row ── */}
          <div className="row g-4 g-lg-5 mb-5 mb-lg-8">

            {/* ── Left: Image Gallery ── */}
            <div className="col-12 col-lg-6">
              <div className="row g-2 mb-3">
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="col-auto">
                    <div className="d-flex flex-column gap-2">
                      {images.map((img, i) => (
                        <div
                          key={i}
                          className={`rounded-2 border p-1 cursor-pointer ${selectedImg === i ? 'border-warning border-2' : 'border-translucent'}`}
                          style={{ cursor: 'pointer', width: 72, height: 72 }}
                          onClick={() => handleImageSelect(i)}
                        >
                          <img
                            src={img}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Main image */}
                <div className="col">
                  <div
                    className="d-flex align-items-center justify-content-center border border-translucent rounded-3 bg-white"
                    style={{ minHeight: 450, padding: '2rem' }}
                  >
                    <img
                      className="img-fluid"
                      src={images[selectedImg]}
                      alt={product.name}
                      style={{ maxHeight: 480, objectFit: 'contain', width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Wishlist + Cart buttons */}
              {(!isAuthenticated || (user?.role !== 'vendor' && user?.role !== 'admin')) && (
                <div className="d-flex gap-2">
                  <button
                    className={`btn btn-lg rounded-pill flex-fill px-2 fs-9 ${isWishlisted ? 'btn-primary text-white' : 'btn-outline-warning'}`}
                    onClick={addToWishlist}
                    disabled={wishlistLoading}
                  >
                    <span className={`${isWishlisted ? 'fas' : 'far'} fa-heart me-2`}></span>
                    {isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  </button>
                  <button
                    className="btn btn-lg btn-warning rounded-pill flex-fill fs-9"
                    onClick={addToCart}
                    disabled={product.stock === 0}
                  >
                    <span className="fas fa-shopping-cart me-2"></span>
                    Add to cart
                  </button>
                </div>
              )}
            </div>

            {/* ── Right: Product Info ── */}
            <div className="col-12 col-lg-6">
              <div className="d-flex flex-column h-100 gap-3">

                {/* Stars + review count */}
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <div className="d-flex gap-1">{renderStars(product.rating || 0)}</div>
                  <p className="text-primary fw-semibold mb-0 fs-9">
                    {product.reviewCount || 0} People rated and reviewed
                  </p>
                </div>

                {/* Title */}
                <h3 className="mb-0 lh-sm">{product.name}</h3>

                {/* Vendor badge */}
                {product.vendorId?.businessName && (
                  <div>
                    <Link
                      to={`/store/${product.vendorId.slug || product.vendorId._id || product.vendorId}`}
                      className="badge text-bg-success fs-9 rounded-pill fw-semibold text-decoration-none"
                    >
                      <span className="fas fa-store me-1"></span>{product.vendorId.businessName}
                    </Link>
                  </div>
                )}

                {/* Price row */}
                <div className="d-flex flex-wrap align-items-baseline gap-2">
                  <h2 className="mb-0 text-body-emphasis">PKR {price?.toLocaleString()}</h2>
                  {hasDiscount && (
                    <>
                      <span className="text-body-quaternary text-decoration-line-through fs-7">
                        PKR {product.price?.toLocaleString()}
                      </span>
                      <span className="badge bg-warning text-dark fw-bold fs-9">{discountPct}% off</span>
                    </>
                  )}
                </div>

                {/* Stock badge — contained, won't overflow */}
                <div>
                  {product.stock > 0 ? (
                    <span className="badge text-bg-success fs-9 fw-semibold px-3 py-2">
                      <span className="fas fa-check-circle me-1"></span>
                      In stock ({product.stock} available)
                    </span>
                  ) : (
                    <span className="badge text-bg-danger fs-9 fw-semibold px-3 py-2">
                      <span className="fas fa-times-circle me-1"></span>
                      Out of stock
                    </span>
                  )}
                </div>

                {/* Short description */}
                {product.description && (
                  <p className="mb-0 text-body-secondary lh-base" style={{ fontSize: '0.9rem' }}>
                    {product.description}
                  </p>
                )}

                {/* Sale timer */}
                {product.saleEndsAt && new Date(product.saleEndsAt) > new Date() && (
                  <p className="text-danger fw-bold mb-0">
                    <span className="fas fa-clock me-1"></span>Special offer ends soon
                  </p>
                )}

                {/* ── Variant Groups ── */}
                {Object.keys(variantGroups).length > 0 && (
                  <div className="d-flex flex-column gap-3">
                    {Object.entries(variantGroups).map(([groupName, options]) => (
                      <div key={groupName}>
                        <p className="fw-semibold mb-2 text-body">
                          {groupName}:{' '}
                          <span className="text-body-emphasis">{selectedVariants[groupName]}</span>
                        </p>
                        <div className="d-flex flex-wrap gap-2">
                          {options.map((v, i) => {
                            const isSelected = selectedVariants[groupName] === v.value
                            return v.image ? (
                              // Image swatch
                              <div
                                key={i}
                                className={`rounded-2 border p-1 cursor-pointer ${isSelected ? 'border-warning border-2' : 'border-translucent'}`}
                                style={{ cursor: 'pointer', width: 56, height: 56 }}
                                onClick={() => handleVariantSelect(groupName, v.value, v.image)}
                                title={v.value}
                              >
                                <img src={v.image} alt={v.value} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </div>
                            ) : (
                              // Text chip
                              <button
                                key={i}
                                className={`btn btn-sm rounded-pill px-3 py-1 ${isSelected ? 'btn-warning fw-bold' : 'btn-outline-secondary'}`}
                                style={{ fontSize: '0.85rem', minWidth: 48 }}
                                onClick={() => handleVariantSelect(groupName, v.value, v.image)}
                              >
                                {v.value}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity */}
                {(!isAuthenticated || (user?.role !== 'vendor' && user?.role !== 'admin')) && (
                  <div>
                    <p className="fw-semibold mb-2 text-body">Quantity :</p>
                    <div className="d-flex align-items-center gap-2">
                      <div className="d-flex align-items-center border border-translucent rounded-2 overflow-hidden">
                        <button
                          className="btn btn-phoenix-primary px-3 border-0"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <span className="fas fa-minus"></span>
                        </button>
                        <input
                          className="form-control text-center input-spin-none bg-transparent border-0"
                          style={{ width: 56 }}
                          type="number"
                          min="1"
                          max={product.stock}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                        <button
                          className="btn btn-phoenix-primary px-3 border-0"
                          onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
                        >
                          <span className="fas fa-plus"></span>
                        </button>
                      </div>
                      <button className="btn btn-phoenix-secondary px-3">
                        <span className="fas fa-share-alt fs-8"></span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs: Description / Specification / Reviews ── */}
      <section className="py-0 mt-4">
        <div className="container-small">
          <ul className="nav nav-underline fs-9 mb-4" role="tablist">
            {['description', 'specification', 'reviews'].map(tab => (
              <li className="nav-item" key={tab}>
                <button
                  className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'reviews' ? 'Ratings & reviews' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              </li>
            ))}
          </ul>

          <div className="row gx-3 gy-7">
            <div className="col-12 col-lg-7 col-xl-8">
              {activeTab === 'description' && (
                <div className="pe-lg-6 pe-xl-12 text-body-emphasis">
                  <p className="mb-0">{product.description || 'No description available.'}</p>
                </div>
              )}

              {activeTab === 'specification' && (
                <div className="pe-lg-6 pe-xl-12">
                  <h5 className="mb-3 fw-bold">Product Details</h5>
                  <table className="table">
                    <tbody>
                      <tr>
                        <td className="bg-body-highlight align-middle" style={{ width: '40%' }}>
                          <h6 className="mb-0 text-body text-uppercase fw-bolder px-4 fs-9 lh-sm">Name</h6>
                        </td>
                        <td className="px-5 mb-0">{product.name}</td>
                      </tr>
                      {product.categoryId?.name && (
                        <tr>
                          <td className="bg-body-highlight align-middle">
                            <h6 className="mb-0 text-body text-uppercase fw-bolder px-4 fs-9 lh-sm">Category</h6>
                          </td>
                          <td className="px-5 mb-0">{product.categoryId.name}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="bg-body-highlight align-middle">
                          <h6 className="mb-0 text-body text-uppercase fw-bolder px-4 fs-9 lh-sm">Price</h6>
                        </td>
                        <td className="px-5 mb-0">PKR {product.price?.toLocaleString()}</td>
                      </tr>
                      {product.salePrice && (
                        <tr>
                          <td className="bg-body-highlight align-middle">
                            <h6 className="mb-0 text-body text-uppercase fw-bolder px-4 fs-9 lh-sm">Sale Price</h6>
                          </td>
                          <td className="px-5 mb-0">PKR {product.salePrice.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="bg-body-highlight align-middle">
                          <h6 className="mb-0 text-body text-uppercase fw-bolder px-4 fs-9 lh-sm">Stock</h6>
                        </td>
                        <td className="px-5 mb-0">{product.stock} units</td>
                      </tr>
                      {product.vendorId?.businessName && (
                        <tr>
                          <td className="bg-body-highlight align-middle">
                            <h6 className="mb-0 text-body text-uppercase fw-bolder px-4 fs-9 lh-sm">Seller</h6>
                          </td>
                          <td className="px-5 mb-0">{product.vendorId.businessName}</td>
                        </tr>
                      )}
                      {product.tags?.length > 0 && (
                        <tr>
                          <td className="bg-body-highlight align-middle">
                            <h6 className="mb-0 text-body text-uppercase fw-bolder px-4 fs-9 lh-sm">Tags</h6>
                          </td>
                          <td className="px-5 mb-0">{product.tags.join(', ')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <div className="bg-body-emphasis rounded-3 p-4 border border-translucent mb-4">
                    <div className="d-flex align-items-center flex-wrap gap-2 mb-4">
                      <h2 className="fw-bolder me-1 mb-0">
                        {product.rating || 0}
                        <span className="fs-8 text-body-quaternary fw-bold">/5</span>
                      </h2>
                      <div className="me-2">{renderStars(product.rating || 0)}</div>
                      <p className="text-body mb-0 fw-semibold fs-7">{product.reviewCount || 0} ratings</p>
                    </div>

                    {(!isAuthenticated || (user?.role !== 'vendor' && user?.role !== 'admin')) && (
                      <form onSubmit={submitReview} className="mb-4 border-top border-translucent pt-4">
                        <h5 className="mb-3">Write a Review</h5>
                        <div className="mb-3">
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
                        </div>
                        <div className="mb-3">
                          <textarea
                            className="form-control"
                            rows="3"
                            placeholder="What did you like or dislike?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          ></textarea>
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={reviewLoading}>
                          {reviewLoading ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    )}

                    {reviews.length > 0 ? (
                      <div className="mt-4">
                        {reviews.map(r => (
                          <div key={r._id} className="border-bottom border-translucent pb-4 mb-4">
                            <div className="d-flex align-items-center mb-2">
                              <h6 className="mb-0 me-2">{r.customerId?.name || 'User'}</h6>
                              {r.isVerifiedPurchase && (
                                <span className="badge badge-tag bg-success-subtle text-success fs-10">Verified Purchase</span>
                              )}
                            </div>
                            <div className="mb-2">{renderStars(r.rating)}</div>
                            <p className="text-body-secondary mb-0">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-body-tertiary text-center py-4 mb-0">
                        No reviews yet. Be the first to review this product!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Similar Products Slider ── */}
      {similarProducts.length > 0 && (
        <section className="py-0 mb-9 mt-7">
          <div className="container-small">
            <div className="d-flex flex-between-center mb-3">
              <div>
                <h3>Similar Products</h3>
                <p className="mb-0 text-body-tertiary fw-semibold">Essential for a better life</p>
              </div>
              <Link className="btn btn-sm btn-phoenix-primary" to="/products">View all</Link>
            </div>
            <div className="swiper-theme-container products-slider">
              <div
                className="swiper swiper theme-slider"
                data-swiper='{"slidesPerView":1,"spaceBetween":16,"breakpoints":{"450":{"slidesPerView":2,"spaceBetween":16},"768":{"slidesPerView":3,"spaceBetween":16},"992":{"slidesPerView":4,"spaceBetween":16},"1200":{"slidesPerView":5,"spaceBetween":16}}}'
              >
                <div className="swiper-wrapper">
                  {similarProducts.map(sp => {
                    const spPrice = sp.salePrice || sp.price
                    return (
                      <div className="swiper-slide" key={sp._id}>
                        <div className="position-relative product-card h-100">
                          <div className="d-flex flex-column justify-content-between h-100">
                            <div>
                              {/* Image box with always-visible wishlist heart */}
                              <div className="border border-1 border-translucent rounded-3 position-relative mb-3 overflow-hidden">
                                <button
                                  className="btn btn-wish btn-wish-primary position-absolute top-0 end-0 z-2 m-1 p-1"
                                  title="Add to wishlist"
                                  style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '50%', lineHeight: 1 }}
                                  onClick={async (e) => {
                                    e.preventDefault()
                                    if (!isAuthenticated) return toast.info('Please login first')
                                    try {
                                      await api.post('/wishlist', { productId: sp._id })
                                      toast.success('Added to wishlist')
                                    } catch { toast.error('Failed') }
                                  }}
                                >
                                  <span className="far fa-heart text-warning fs-9"></span>
                                </button>
                                <img
                                  className="img-fluid w-100"
                                  src={sp.images?.[0] || '/assets/img/products/1.png'}
                                  alt={sp.name}
                                  style={{ height: 160, objectFit: 'contain', display: 'block', padding: '0.5rem' }}
                                />
                              </div>
                              <Link className="stretched-link" to={`/product/${sp._id}`}>
                                <h6 className="mb-2 lh-sm line-clamp-2 product-name">{sp.name}</h6>
                              </Link>
                              {sp.rating > 0 && (
                                <p className="fs-10 mb-1">
                                  {renderStars(sp.rating)}
                                  <span className="text-body-quaternary fw-semibold ms-1">({sp.reviewCount || 0})</span>
                                </p>
                              )}
                            </div>
                            <div>
                              {sp.vendorId?.businessName && (
                                <p className="fs-10 text-body-tertiary fw-semibold lh-1 mb-1">{sp.vendorId.businessName}</p>
                              )}
                              <div className="d-flex flex-wrap align-items-baseline gap-1 mb-1">
                                {sp.salePrice && sp.salePrice < sp.price && (
                                  <span className="text-body-quaternary text-decoration-line-through fs-10">
                                    PKR {sp.price?.toLocaleString()}
                                  </span>
                                )}
                                <h5 className="text-body-emphasis mb-0">PKR {spPrice?.toLocaleString()}</h5>
                              </div>
                              <p className="fs-10 text-body-tertiary fw-semibold lh-1 mb-2">
                                {sp.stock > 0 ? `In Stock: ${sp.stock}` : 'Out of stock'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="swiper-nav">
                <div className="swiper-button-next"><span className="fas fa-chevron-right nav-icon"></span></div>
                <div className="swiper-button-prev"><span className="fas fa-chevron-left nav-icon"></span></div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
