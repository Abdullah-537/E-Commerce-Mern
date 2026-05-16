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
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [activeTab, setActiveTab] = useState('description')
  const [similarProducts, setSimilarProducts] = useState([])
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => {
        const p = res.data.data;
        setProduct(p);
        // Load similar products from same category
        if (p.categoryId?._id || p.categoryId) {
          const catId = p.categoryId?._id || p.categoryId;
          api.get(`/products?category=${catId}&limit=8`)
            .then(r => {
              const all = r.data.data.products || r.data.data || [];
              setSimilarProducts(all.filter(x => x._id !== p._id).slice(0, 6));
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // Initialize Swiper for similar products after render
  useEffect(() => {
    if (similarProducts.length === 0) return;
    const timer = setTimeout(() => {
      document.querySelectorAll('.swiper-theme-container').forEach(container => {
        if (!window.Swiper || !container) return;
        const swiperEl = container.querySelector('[data-swiper]');
        if (!swiperEl) return;
        if (swiperEl.swiper) { try { swiperEl.swiper.destroy(true, true); } catch (e) {} }
        let config = {};
        try { config = JSON.parse(swiperEl.getAttribute('data-swiper') || '{}'); } catch (e) {}
        const nav = container.querySelector('.swiper-nav');
        new window.Swiper(swiperEl, {
          ...config,
          observer: true,
          observeParents: true,
          navigation: {
            nextEl: nav?.querySelector('.swiper-button-next'),
            prevEl: nav?.querySelector('.swiper-button-prev'),
          },
        });
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [similarProducts]);

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

  const addToWishlist = async () => {
    if (!isAuthenticated) {
      toast.info('Please login first')
      return navigate('/login', { state: { from: location } })
    }
    try {
      await api.post('/wishlist', { productId: id })
      toast.success('Added to wishlist')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const renderStars = (rating) => {
    const stars = []
    const full = Math.floor(rating)
    const half = rating % 1 >= 0.5
    for (let i = 0; i < full; i++) stars.push(<span key={`f${i}`} className="fa fa-star text-warning"></span>)
    if (half) stars.push(<span key="h" className="fa fa-star-half-alt star-icon text-warning"></span>)
    const empty = 5 - full - (half ? 1 : 0)
    for (let i = 0; i < empty; i++) stars.push(<span key={`e${i}`} className="fa-regular fa-star text-warning-light"></span>)
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
  const images = product.images?.length ? product.images : ['/assets/img/products/1.png']

  // Group variants by name (e.g. Color, Size)
  const variantGroups = {};
  if (product.variants?.length) {
    product.variants.forEach(v => {
      if (!variantGroups[v.name]) variantGroups[v.name] = [];
      variantGroups[v.name].push(v);
    });
  }

  return (
    <div className="pt-5 pb-9">
      {/* Product Hero Section */}
      <section className="py-0">
        <div className="container-small">
          <nav className="mb-3" aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
              {product.categoryId?.name && (
                <li className="breadcrumb-item"><Link to={`/products?category=${product.categoryId._id}`}>{product.categoryId.name}</Link></li>
              )}
              <li className="breadcrumb-item active" aria-current="page">{product.name}</li>
            </ol>
          </nav>
          <div className="row g-5 mb-5 mb-lg-8">
            {/* Image Gallery */}
            <div className="col-12 col-lg-6">
              <div className="row g-3 mb-3">
                {images.length > 1 && (
                  <div className="col-12 col-md-2 col-lg-12 col-xl-2">
                    <div className="d-flex flex-xl-column gap-2">
                      {images.map((img, i) => (
                        <div
                          key={i}
                          className={`rounded-1 border cursor-pointer ${selectedImg === i ? 'border-primary border-2' : 'border-translucent'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedImg(i)}
                        >
                          <img src={img} alt="" width="38" className="rounded-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className={images.length > 1 ? "col-12 col-md-10 col-lg-12 col-xl-10" : "col-12"}>
                  <div className="d-flex align-items-center justify-content-center border border-translucent rounded-3 text-center p-5 h-100">
                    <img className="img-fluid" src={images[selectedImg]} alt={product.name} style={{maxHeight: '400px', objectFit: 'contain'}} />
                  </div>
                </div>
              </div>
              <div className="d-flex">
                <button className="btn btn-lg btn-outline-warning rounded-pill w-100 me-3 px-2 px-sm-4 fs-9 fs-sm-8" onClick={addToWishlist}>
                  <span className="me-2 far fa-heart"></span>Add to wishlist
                </button>
                <button className="btn btn-lg btn-warning rounded-pill w-100 fs-9 fs-sm-8" onClick={addToCart} disabled={product.stock === 0}>
                  <span className="fas fa-shopping-cart me-2"></span>Add to cart
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div className="col-12 col-lg-6">
              <div className="d-flex flex-column justify-content-between h-100">
                <div>
                  {/* Stars */}
                  <div className="d-flex flex-wrap">
                    <div className="me-2">{renderStars(product.rating || 0)}</div>
                    <p className="text-primary fw-semibold mb-2">
                      {product.reviewCount || 0} People rated and reviewed
                    </p>
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 lh-sm">{product.name}</h3>

                  {/* Vendor badge */}
                  {product.vendorId?.businessName && (
                    <div className="d-flex flex-wrap align-items-start mb-3">
                      <span className="badge text-bg-success fs-9 rounded-pill me-2 fw-semibold">
                        <span className="fas fa-store me-1"></span>{product.vendorId.businessName}
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="d-flex flex-wrap align-items-center">
                    <h1 className="me-3">PKR {price?.toLocaleString()}</h1>
                    {hasDiscount && (
                      <>
                        <p className="text-body-quaternary text-decoration-line-through fs-6 mb-0 me-3">
                          PKR {product.price?.toLocaleString()}
                        </p>
                        <p className="text-warning fw-bolder fs-6 mb-0">{discountPct}% off</p>
                      </>
                    )}
                  </div>

                  {/* Stock */}
                  <p className={`fw-semibold fs-7 mb-3 ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
                    {product.stock > 0 ? `In stock (${product.stock} available)` : 'Out of stock'}
                  </p>

                  {/* Description excerpt */}
                  {product.description && (
                    <p className="mb-3 text-body-secondary">{product.description}</p>
                  )}

                  {/* Sale timer */}
                  {product.saleEndsAt && new Date(product.saleEndsAt) > new Date() && (
                    <p className="text-danger-dark fw-bold mb-4">
                      <span className="fas fa-clock me-1"></span>
                      Special offer ends soon
                    </p>
                  )}
                </div>

                <div>
                  {/* Color / Variant Swatches */}
                  {Object.keys(variantGroups).map(groupName => (
                    <div className="mb-3" key={groupName}>
                      <p className="fw-semibold mb-2 text-body">
                        {groupName} : <span className="text-body-emphasis">{selectedVariant?.value || variantGroups[groupName][0]?.value}</span>
                      </p>
                      <div className="d-flex product-color-variants">
                        {variantGroups[groupName].map((v, i) => (
                          <div
                            key={i}
                            className={`rounded-1 border me-2 cursor-pointer ${selectedVariant?.value === v.value ? 'border-primary border-2' : 'border-translucent'}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedVariant(v)}
                          >
                            {v.image ? (
                              <img src={v.image} alt={v.value} width="38" className="rounded-1" />
                            ) : (
                              <div className="d-flex align-items-center justify-content-center px-2 py-1" style={{minWidth: 38, minHeight: 38}}>
                                <span className="fs-9 fw-semibold text-body-emphasis">{v.value}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Quantity + Share */}
                  <div className="row g-3 g-sm-5 align-items-end">
                    <div className="col-12 col-sm">
                      <p className="fw-semibold mb-2 text-body">Quantity :</p>
                      <div className="d-flex justify-content-between align-items-end">
                        <div className="d-flex flex-between-center">
                          <button className="btn btn-phoenix-primary px-3" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                            <span className="fas fa-minus"></span>
                          </button>
                          <input
                            className="form-control text-center input-spin-none bg-transparent border-0 outline-none"
                            style={{ width: 50 }}
                            type="number"
                            min="1"
                            max={product.stock}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          />
                          <button className="btn btn-phoenix-primary px-3" onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}>
                            <span className="fas fa-plus"></span>
                          </button>
                        </div>
                        <button className="btn btn-phoenix-primary px-3 border-0">
                          <span className="fas fa-share-alt fs-7"></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description / Specification / Reviews Tabs */}
      <section className="py-0">
        <div className="container-small">
          <ul className="nav nav-underline fs-9 mb-4" role="tablist">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>Description</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'specification' ? 'active' : ''}`} onClick={() => setActiveTab('specification')}>Specification</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Ratings &amp; reviews</button>
            </li>
          </ul>
          <div className="row gx-3 gy-7">
            <div className="col-12 col-lg-7 col-xl-8">
              {/* Description Tab */}
              {activeTab === 'description' && (
                <div className="pe-lg-6 pe-xl-12 text-body-emphasis">
                  <p className="mb-0">{product.description || 'No description available.'}</p>
                </div>
              )}

              {/* Specification Tab */}
              {activeTab === 'specification' && (
                <div className="pe-lg-6 pe-xl-12">
                  <h5 className="mb-3 ms-4 fw-bold">Product Details</h5>
                  <table className="table">
                    <tbody>
                      <tr>
                        <td className="bg-body-highlight align-middle" style={{width: '40%'}}>
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

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div>
                  <div className="bg-body-emphasis rounded-3 p-4 border border-translucent">
                    <div className="row g-3 justify-content-between mb-4">
                      <div className="col-auto">
                        <div className="d-flex align-items-center flex-wrap">
                          <h2 className="fw-bolder me-3">{product.rating || 0}<span className="fs-8 text-body-quaternary fw-bold">/5</span></h2>
                          <div className="me-3">{renderStars(product.rating || 0)}</div>
                          <p className="text-body mb-0 fw-semibold fs-7">{product.reviewCount || 0} ratings</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-body-tertiary text-center py-5 mb-0">
                      {product.reviewCount > 0 ? 'Reviews are displayed here.' : 'No reviews yet. Be the first to review this product!'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Similar Products */}
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
              <div className="swiper swiper theme-slider"
                data-swiper='{"slidesPerView":1,"spaceBetween":16,"breakpoints":{"450":{"slidesPerView":2,"spaceBetween":16},"768":{"slidesPerView":3,"spaceBetween":16},"992":{"slidesPerView":4,"spaceBetween":16},"1200":{"slidesPerView":5,"spaceBetween":16},"1540":{"slidesPerView":6,"spaceBetween":16}}}'>
                <div className="swiper-wrapper">
                  {similarProducts.map(sp => (
                    <div className="swiper-slide" key={sp._id}>
                      <div className="position-relative text-decoration-none product-card h-100">
                        <div className="d-flex flex-column justify-content-between h-100">
                          <div>
                            <div className="border border-1 border-translucent rounded-3 position-relative mb-3">
                              <button className="btn btn-wish btn-wish-primary z-2 d-toggle-container" title="Add to wishlist">
                                <span className="fas fa-heart d-block-hover" data-fa-transform="down-1"></span>
                                <span className="far fa-heart d-none-hover" data-fa-transform="down-1"></span>
                              </button>
                              <img className="img-fluid" src={sp.images?.[0] || '/assets/img/products/1.png'} alt={sp.name} />
                            </div>
                            <Link className="stretched-link" to={`/product/${sp._id}`}>
                              <h6 className="mb-2 lh-sm line-clamp-3 product-name">{sp.name}</h6>
                            </Link>
                            <p className="fs-9">
                              <span className="fa fa-star text-warning"></span>
                              <span className="fa fa-star text-warning"></span>
                              <span className="fa fa-star text-warning"></span>
                              <span className="fa fa-star text-warning"></span>
                              <span className="fa fa-star text-warning"></span>
                              <span className="text-body-quaternary fw-semibold ms-1">({sp.reviewCount || 0} rated)</span>
                            </p>
                          </div>
                          <div>
                            <div className="d-flex align-items-center mb-1">
                              {sp.salePrice ? (
                                <>
                                  <p className="me-2 text-body text-decoration-line-through mb-0">PKR {sp.price?.toLocaleString()}</p>
                                  <h3 className="text-body-emphasis mb-0">PKR {sp.salePrice?.toLocaleString()}</h3>
                                </>
                              ) : (
                                <h3 className="text-body-emphasis mb-0">PKR {sp.price?.toLocaleString()}</h3>
                              )}
                            </div>
                            <p className="text-body-tertiary fw-semibold fs-9 lh-1 mb-0">
                              {sp.stock > 0 ? `In Stock: ${sp.stock}` : 'Out of stock'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
