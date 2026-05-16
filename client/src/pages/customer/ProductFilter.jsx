import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../../store/api/baseApi'

export default function ProductFilter() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [error, setError] = useState(null)
  const fetchRef = useRef(0)

  // Derive category from URL
  const currentCategory = searchParams.get('category') || ''
  const currentMinPrice = searchParams.get('minPrice') || ''
  const currentMaxPrice = searchParams.get('maxPrice') || ''
  const currentSearch = searchParams.get('search') || ''

  useEffect(() => {
    const fetchId = ++fetchRef.current
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (currentCategory) params.set('category', currentCategory)
    if (currentMinPrice) params.set('minPrice', currentMinPrice)
    if (currentMaxPrice) params.set('maxPrice', currentMaxPrice)
    if (currentSearch) params.set('search', currentSearch)

    api.get(`/products?${params.toString()}`)
      .then(res => {
        if (fetchId !== fetchRef.current) return
        const data = res.data?.data
        if (Array.isArray(data)) {
          setProducts(data)
        } else if (data?.products && Array.isArray(data.products)) {
          setProducts(data.products)
        } else {
          setProducts([])
        }
      })
      .catch(err => {
        if (fetchId !== fetchRef.current) return
        console.error('Product fetch error:', err)
        setProducts([])
        setError('Failed to load products')
      })
      .finally(() => {
        if (fetchId === fetchRef.current) {
          setLoading(false)
        }
      })
  }, [currentCategory, currentMinPrice, currentMaxPrice, currentSearch])

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data?.data || [])).catch(() => {})
  }, [])

  const renderStars = useCallback((rating) => {
    const stars = []
    const full = Math.floor(rating || 0)
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={`fa fa-star ${i < full ? 'text-warning' : 'text-body-quaternary'}`} style={{ fontSize: '0.6rem' }}></span>
      )
    }
    return stars
  }, [])

  const selectCategory = (e, catId) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (catId) params.set('category', catId)
    navigate(`/products?${params.toString()}`, { replace: false })
  }

  const applyPriceFilter = () => {
    const params = new URLSearchParams()
    if (currentCategory) params.set('category', currentCategory)
    if (priceRange.min) params.set('minPrice', priceRange.min)
    if (priceRange.max) params.set('maxPrice', priceRange.max)
    navigate(`/products?${params.toString()}`, { replace: false })
  }

  const getImgSrc = (p) => {
    try {
      if (Array.isArray(p.images) && p.images.length > 0) return p.images[0]
      if (typeof p.images === 'string' && p.images) return p.images
      return '/assets/img/products/60x60/1.png'
    } catch { return '/assets/img/products/60x60/1.png' }
  }

  const getPrice = (p) => {
    try {
      const sale = Number(p.salePrice)
      const base = Number(p.price)
      if (!isNaN(sale) && sale > 0 && sale < base) return { sale: sale, base: base, hasSale: true }
      return { sale: base, base: base, hasSale: false }
    } catch { return { sale: 0, base: 0, hasSale: false } }
  }

  return (
    <section className="pt-5 pb-9">
      <div className="container-small">
        <nav className="mb-3" aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Products</li>
          </ol>
        </nav>
        <h2 className="mb-5">Products</h2>
        <div className="row">
          {/* Sidebar Filters */}
          <div className="col-12 col-lg-3 mb-4">
            <div className="card mb-3">
              <div className="card-body">
                <h6 className="text-body-highlight mb-3">Categories</h6>
                <div className="d-flex flex-column gap-1">
                  <a
                    href="#"
                    className={`text-body-emphasis text-decoration-none bg-body-highlight-hover px-2 py-1 rounded-2 fs-9 ${!currentCategory ? 'fw-bold text-primary' : ''}`}
                    onClick={(e) => selectCategory(e, null)}
                  >All Categories</a>
                  {categories.map(cat => (
                    <a
                      key={cat._id}
                      href="#"
                      className={`text-body-emphasis text-decoration-none bg-body-highlight-hover px-2 py-1 rounded-2 fs-9 ${currentCategory === cat._id ? 'fw-bold text-primary' : ''}`}
                      onClick={(e) => selectCategory(e, cat._id)}
                    >{cat.name}</a>
                  ))}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h6 className="text-body-highlight mb-3">Price Range</h6>
                <div className="d-flex gap-2 align-items-center">
                  <input
                    className="form-control form-control-sm"
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={e => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  />
                  <span className="text-body-tertiary">—</span>
                  <input
                    className="form-control form-control-sm"
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={e => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  />
                </div>
                <button
                  className="btn btn-phoenix-primary btn-sm w-100 mt-2"
                  onClick={applyPriceFilter}
                >Apply</button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="col-12 col-lg-9">
            {loading ? (
              <div className="text-center py-9"><div className="spinner-border text-primary" role="status"></div></div>
            ) : error ? (
              <div className="text-center py-9">
                <span className="fas fa-exclamation-triangle fs-5 text-warning mb-4 d-block"></span>
                <h4 className="text-body-emphasis">{error}</h4>
                <p className="text-body-tertiary">Please try again later.</p>
              </div>
            ) : products.length > 0 ? (
              <div className="row g-3">
                {products.map(p => {
                  const price = getPrice(p)
                  return (
                    <div className="col-6 col-md-4 col-xl-3" key={p._id}>
                      <div className="position-relative text-decoration-none product-card h-100">
                        <div className="d-flex flex-column justify-content-between h-100">
                          <div>
                            <div className="border border-1 border-translucent rounded-3 position-relative mb-3">
                              <img className="img-fluid" src={getImgSrc(p)} alt={p.name || ''} />
                            </div>
                            <Link className="stretched-link" to={`/product/${p._id}`}>
                              <h6 className="mb-2 lh-sm line-clamp-3 product-name">{p.name}</h6>
                            </Link>
                            {p.rating > 0 && (
                              <p className="fs-9 mb-1">
                                {renderStars(p.rating)}
                                <span className="text-body-quaternary fw-semibold ms-1">({p.reviewCount || 0})</span>
                              </p>
                            )}
                          </div>
                          <div>
                            {p.vendorId?.businessName && (
                              <p className="fs-9 text-body-tertiary fw-semibold lh-1 mb-1">{p.vendorId.businessName}</p>
                            )}
                            <div className="d-flex align-items-center mb-1">
                              {price.hasSale && (
                                <p className="me-2 text-body text-decoration-line-through mb-0">PKR {price.base.toLocaleString()}</p>
                              )}
                              <h3 className="text-body-emphasis mb-0">PKR {(price.hasSale ? price.sale : price.base).toLocaleString()}</h3>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-9">
                <span className="fas fa-search fs-5 text-body-quaternary mb-4 d-block"></span>
                <h4 className="text-body-emphasis">No products found</h4>
                <p className="text-body-tertiary">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}