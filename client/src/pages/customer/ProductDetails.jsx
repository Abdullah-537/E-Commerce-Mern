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
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => setProduct(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

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
  const images = product.images?.length ? product.images : ['/assets/img/products/60x60/1.png']

  return (
    <div className="pt-5 pb-9">
      {/* Product Hero Section */}
      <section className="py-0">
        <div className="container-small">
          <nav className="mb-3" aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
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
                          className={`rounded-1 border ${selectedImg === i ? 'border-primary' : 'border-translucent'} cursor-pointer`}
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
                  <div className="d-flex align-items-center border border-translucent rounded-3 text-center p-5 h-100">
                    <img className="img-fluid" src={images[selectedImg]} alt={product.name} />
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
                  {product.rating > 0 && (
                    <div className="d-flex flex-wrap">
                      <div className="me-2">{renderStars(product.rating)}</div>
                      <p className="text-primary fw-semibold mb-2">
                        {product.reviewCount || 0} People rated and reviewed
                      </p>
                    </div>
                  )}
                  <h3 className="mb-3 lh-sm">{product.name}</h3>
                  {product.vendorId?.businessName && (
                    <div className="d-flex flex-wrap align-items-start mb-3">
                      <span className="badge text-bg-success fs-9 rounded-pill me-2 fw-semibold">
                        <span className="fas fa-store me-1"></span>{product.vendorId.businessName}
                      </span>
                    </div>
                  )}
                  <div className="d-flex flex-wrap align-items-center">
                    <h1 className="me-3">PKR {price.toLocaleString()}</h1>
                    {hasDiscount && (
                      <>
                        <p className="text-body-quaternary text-decoration-line-through fs-6 mb-0 me-3">
                          PKR {product.price.toLocaleString()}
                        </p>
                        <p className="text-warning fw-bolder fs-6 mb-0">{discountPct}% off</p>
                      </>
                    )}
                  </div>
                  <p className={`fw-semibold fs-7 mb-2 ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
                    {product.stock > 0 ? `In stock (${product.stock} available)` : 'Out of stock'}
                  </p>
                  {product.description && (
                    <p className="mb-2 text-body-secondary">{product.description}</p>
                  )}
                </div>
                <div>
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
                          <button className="btn btn-phoenix-primary px-3" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>
                            <span className="fas fa-plus"></span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description Tab */}
      <section className="py-0">
        <div className="container-small">
          <ul className="nav nav-underline fs-9 mb-4" role="tablist">
            <li className="nav-item">
              <a className="nav-link active" id="description-tab" data-bs-toggle="tab" href="#tab-description" role="tab" aria-controls="tab-description" aria-selected="true">Description</a>
            </li>
          </ul>
          <div className="row gx-3 gy-7">
            <div className="col-12">
              <div className="tab-content">
                <div className="tab-pane fade show active text-body-emphasis" id="tab-description" role="tabpanel" aria-labelledby="description-tab">
                  <p className="mb-0">{product.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
