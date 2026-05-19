
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../store/api/baseApi';

// Helper: upgrade 60x60 thumbnail path to full-size product image
const getFullImage = (imgPath) => {
  if (!imgPath) return '/assets/img/products/1.png';
  // Convert /assets/img/products/60x60/X.png -> /assets/img/products/X.png
  return imgPath.replace('/60x60/', '/');
};

// Helper: manually initialize Swiper on a container (mirrors phoenix.js swiperInit)
const initSwiperContainer = (container) => {
  if (!window.Swiper || !container) return;
  const swiperEl = container.querySelector('[data-swiper]');
  if (!swiperEl) return;

  // Destroy any existing (possibly broken/empty) Swiper instance
  if (swiperEl.swiper) {
    try { swiperEl.swiper.destroy(true, true); } catch (e) { }
  }

  let config = {};
  try {
    const raw = swiperEl.getAttribute('data-swiper');
    config = JSON.parse(raw || '{}');
  } catch (e) {
    console.warn('Swiper config parse error', e);
  }

  const nav = container.querySelector('.swiper-nav');
  const opts = {
    ...config,
    observer: true,
    observeParents: true,
    watchOverflow: true,
    navigation: {
      nextEl: nav?.querySelector('.swiper-button-next'),
      prevEl: nav?.querySelector('.swiper-button-prev'),
    },
  };

  new window.Swiper(swiperEl, opts);
};

// Reusable Product Card component matching Phoenix theme layout
function ProductCard({ product, showVendor = true, isAuthenticated, userRole, onWishlistClick, isWishlisted = false }) {
  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlistClick) onWishlistClick(product._id, isWishlisted);
  };

  return (
    <div className="position-relative text-decoration-none product-card h-100 border border-1 border-translucent rounded-3 p-3">
      <div className="d-flex flex-column justify-content-between h-100">
        <div>
          <div className="position-relative mb-3">
            {(!isAuthenticated || (isAuthenticated && userRole !== 'vendor' && userRole !== 'admin')) && (
              <button
                className={`btn btn-wish z-2 ${isWishlisted ? 'btn-primary' : 'btn-wish-primary'}`}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                onClick={handleWishlist}
                style={{ cursor: 'pointer', position: 'absolute', top: 0, right: 0 }}
              >
                <span className={`${isWishlisted ? 'fas text-white' : 'far'} fa-heart`}></span>
              </button>
            )}
            <img
              className="img-fluid"
              src={getFullImage(product.images?.[0])}
              alt={product.name}
            />
          </div>
          <Link className="stretched-link" to={`/product/${product._id}`}>
            <h6 className="mb-2 lh-sm line-clamp-3 product-name">{product.name}</h6>
          </Link>
          <p className="fs-9 mb-2">
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
          {showVendor && product.vendorId?.businessName && (
            <Link
              className="fs-9 text-body-highlight fw-bold mb-2 d-block text-truncate text-decoration-none position-relative"
              to={`/store/${product.vendorId.slug || product.vendorId._id || product.vendorId}`}
              style={{ zIndex: 3 }}
            >
              {product.vendorId.businessName}
            </Link>
          )}
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
  );
}

export default function Homepage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [electronicsProducts, setElectronicsProducts] = useState([]);
  const [bestOfferProducts, setBestOfferProducts] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const handleWishlistClick = async (productId, isWishlisted) => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to wishlist');
      return navigate('/login', { state: { from: location } });
    }
    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/${productId}`);
        setWishlistItems(prev => prev.filter(id => id !== productId));
        toast.success('Removed from wishlist!');
      } else {
        await api.post('/wishlist', { productId });
        setWishlistItems(prev => [...prev, productId]);
        toast.success('Added to wishlist!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update wishlist');
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      api.get('/wishlist').then(res => {
        const items = res.data.data?.items?.map(i => i.productId?._id || i.productId) || [];
        setWishlistItems(items);
      }).catch(() => {});
    }

    api.get('/products?limit=12')
      .then(res => {
        const allProducts = res.data.data.products || res.data.data;
        setProducts(allProducts);
        if (allProducts.length > 4) {
          setElectronicsProducts(allProducts.slice(0, Math.ceil(allProducts.length / 2)));
          setBestOfferProducts(allProducts.slice(Math.ceil(allProducts.length / 2)));
        } else {
          setElectronicsProducts(allProducts);
          setBestOfferProducts(allProducts);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    api.get('/categories')
      .then(res => setCategories(res.data.data || []))
      .catch(() => { });
  }, []);

  // Initialize ALL swipers after products render into DOM
  // Must destroy phoenix.js's empty instances and recreate with actual slides
  useEffect(() => {
    if (loading || products.length === 0) return;

    const initAll = () => {
      const containers = document.querySelectorAll('.swiper-theme-container');
      containers.forEach(initSwiperContainer);
    };

    // Multiple attempts with increasing delays to handle React flush timing
    const t1 = setTimeout(initAll, 100);
    const t2 = setTimeout(initAll, 500);
    const t3 = setTimeout(initAll, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [loading, products]);

  // Category icon mapping using Unicons (matching Phoenix theme)
  const getCategoryIcon = (name) => {
    const n = name.toLowerCase();
    const map = {
      'electronics': { icon: 'uil uil-monitor', bg: 'bg-danger-subtle', color: 'text-danger' },
      'clothing': { icon: 'uil uil-shopping-bag', bg: 'bg-success-subtle', color: 'text-success' },
      'fashion': { icon: 'uil uil-watch-alt', bg: 'bg-info-subtle', color: 'text-info' },
      'books': { icon: 'uil uil-book-open', bg: 'bg-warning-subtle', color: 'text-warning' },
      'sports': { icon: 'uil uil-football', bg: 'bg-primary-subtle', color: 'text-primary' },
      'home': { icon: 'uil uil-estate', bg: 'bg-secondary-subtle', color: 'text-secondary' },
      'kitchen': { icon: 'uil uil-lamp', bg: 'bg-secondary-subtle', color: 'text-secondary' },
      'mobile': { icon: 'uil uil-mobile-android', bg: '', color: '' },
      'toys': { icon: 'uil uil-gift', bg: 'bg-success-subtle', color: 'text-success' },
      'grocery': { icon: 'uil uil-shopping-bag', bg: '', color: '' },
      'deals': { icon: 'uil uil-star', bg: 'bg-warning-subtle', color: 'text-warning' },
    };
    const match = Object.entries(map).find(([k]) => n.includes(k));
    return match?.[1] || { icon: 'uil uil-apps', bg: '', color: '' };
  };

  return (
    <>
      <div className="ecommerce-homepage pt-5 mb-9">

        {/* ========== Category Icon Bar (Phoenix style) ========== */}
        <section className="py-0">
          <div className="container-small">
            <div className="scrollbar">
              <div className="d-flex justify-content-between">
                {categories.map(cat => {
                  const { icon, bg, color } = getCategoryIcon(cat.name);
                  return (
                    <Link className="icon-nav-item" to={`/products?category=${cat._id}`} key={cat._id}>
                      <div className={`icon-container mb-2 ${bg}`} data-bs-theme="light">
                        <span className={`fs-4 ${icon} ${color}`}></span>
                      </div>
                      <p className="nav-label">{cat.name}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ========== Banners ========== */}
        <section className="py-0 px-xl-3">
          <div className="container px-xl-0 px-xxl-3">
            <div className="row g-3 mb-9">
              <div className="col-12">
                <div className="whooping-banner w-100 rounded-3 overflow-hidden">
                  <div className="bg-holder z-n1 product-bg" style={{ "backgroundImage": "url(/assets/img/e-commerce/whooping_banner_product.png)", "backgroundPosition": "bottom right" }}></div>
                  <div className="bg-holder z-n1 shape-bg" style={{ "backgroundImage": "url(/assets/img/e-commerce/whooping_banner_shape_2.png)", "backgroundPosition": "bottom left" }}></div>
                  <div className="banner-text" data-bs-theme="light">
                    <h2 className="text-warning-light fw-bolder fs-lg-3 fs-xxl-2">
                      Whooping <span className="gradient-text">60% </span>Off
                    </h2>
                    <h3 className="fw-bolder fs-lg-5 fs-xxl-3 text-white">
                      on everyday items
                    </h3>
                  </div>
                  <Link className="btn btn-lg btn-primary rounded-pill banner-button" to="/products">Shop Now</Link>
                </div>
              </div>
              <div className="col-12 col-xl-6">
                <div className="gift-items-banner w-100 rounded-3 overflow-hidden">
                  <div className="bg-holder z-n1 banner-bg" style={{ "backgroundImage": "url(/assets/img/e-commerce/gift-items-banner-bg.png)" }}></div>
                  <div className="banner-text text-md-center">
                    <h2 className="text-white fw-bolder fs-xl-4">
                      Get <span className="gradient-text">10% Off </span><br className="d-md-none" />
                      on gift items
                    </h2>
                    <Link className="btn btn-lg btn-primary rounded-pill banner-button" to="/products">Buy Now</Link>
                  </div>
                </div>
              </div>
              <div className="col-12 col-xl-6">
                <div className="best-in-market-banner d-flex h-100 px-4 px-sm-7 py-5 px-md-11 rounded-3 overflow-hidden">
                  <div className="bg-holder z-n1 banner-bg" style={{ "backgroundImage": "url(/assets/img/e-commerce/best-in-market-bg.png)" }}></div>
                  <div className="row align-items-center w-sm-100">
                    <div className="col-8">
                      <div className="banner-text">
                        <h2 className="text-white fw-bolder fs-sm-4 mb-5">
                          MI 11 Pro<br /><span className="fs-7 fs-sm-6">Best in the market</span>
                        </h2>
                        <Link className="btn btn-lg btn-warning rounded-pill banner-button" to="/products">Buy Now</Link>
                      </div>
                    </div>
                    <div className="col-4">
                      <img className="w-100 w-sm-75" src="/assets/img/e-commerce/5.png" alt="" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========== Top Deals Today (Swiper Slider) ========== */}
            <div className="row g-4 mb-6">
              <div className="col-12 col-lg-9 col-xxl-10">
                <div className="d-flex flex-between-center mb-3">
                  <div className="d-flex">
                    <span className="fas fa-bolt text-warning fs-6"></span>
                    <h3 className="mx-2">Top Deals today</h3>
                    <span className="fas fa-bolt text-warning fs-6"></span>
                  </div>
                  <Link className="btn btn-link btn-lg p-0 d-none d-md-block" to="/products">
                    Explore more<span className="fas fa-chevron-right fs-9 ms-1"></span>
                  </Link>
                </div>
                <div className="swiper-theme-container products-slider">
                  <div className="swiper swiper theme-slider"
                    data-swiper='{"slidesPerView":1,"spaceBetween":16,"breakpoints":{"450":{"slidesPerView":2,"spaceBetween":16},"768":{"slidesPerView":3,"spaceBetween":20},"1200":{"slidesPerView":4,"spaceBetween":16},"1540":{"slidesPerView":5,"spaceBetween":16}}}'>
                    <div className="swiper-wrapper">
                      {loading ? (
                        <div className="swiper-slide d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                        </div>
                      ) : products.map(product => (
                        <div className="swiper-slide" key={product._id}>
                          <ProductCard product={product} showVendor={true} isAuthenticated={isAuthenticated} userRole={user?.role} onWishlistClick={handleWishlistClick} isWishlisted={wishlistItems.includes(product._id)} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="swiper-nav swiper-product-nav">
                    <div className="swiper-button-next">
                      <span className="fas fa-chevron-right nav-icon"></span>
                    </div>
                    <div className="swiper-button-prev">
                      <span className="fas fa-chevron-left nav-icon"></span>
                    </div>
                  </div>
                </div>
                <Link className="fw-bold d-md-none px-0" to="/products">
                  Explore more<span className="fas fa-chevron-right fs-9 ms-1"></span>
                </Link>
              </div>
              <div className="col-lg-3 d-none d-lg-block col-xxl-2">
                <div className="h-100 position-relative rounded-3 overflow-hidden">
                  <div className="bg-holder" style={{ "backgroundImage": "url(/assets/img/e-commerce/4.png)" }}></div>
                </div>
              </div>
              <div className="col-12 d-lg-none">
                <Link to="/products"><img className="w-100 rounded-3" src="/assets/img/e-commerce/6.png" alt="" /></Link>
              </div>
            </div>

            {/* ========== Top Electronics (Swiper Slider) ========== */}
            <div className="mb-6">
              <div className="d-flex flex-between-center mb-3">
                <h3>Top Electronics</h3>
                <Link className="fw-bold d-none d-md-block" to="/products">
                  Explore more<span className="fas fa-chevron-right fs-9 ms-1"></span>
                </Link>
              </div>
              <div className="swiper-theme-container products-slider">
                <div className="swiper swiper theme-slider"
                  data-swiper='{"slidesPerView":1,"spaceBetween":16,"breakpoints":{"450":{"slidesPerView":2,"spaceBetween":16},"576":{"slidesPerView":3,"spaceBetween":20},"768":{"slidesPerView":4,"spaceBetween":20},"992":{"slidesPerView":5,"spaceBetween":20},"1200":{"slidesPerView":6,"spaceBetween":16}}}'>
                  <div className="swiper-wrapper">
                    {electronicsProducts.map(product => (
                      <div className="swiper-slide" key={'elec-' + product._id}>
                        <ProductCard product={product} showVendor={false} isAuthenticated={isAuthenticated} userRole={user?.role} onWishlistClick={handleWishlistClick} isWishlisted={wishlistItems.includes(product._id)} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="swiper-nav">
                  <div className="swiper-button-next">
                    <span className="fas fa-chevron-right nav-icon"></span>
                  </div>
                  <div className="swiper-button-prev">
                    <span className="fas fa-chevron-left nav-icon"></span>
                  </div>
                </div>
              </div>
              <Link className="fw-bold d-md-none" to="/products">
                Explore more<span className="fas fa-chevron-right fs-9 ms-1"></span>
              </Link>
            </div>

            {/* ========== Best Offers (Swiper Slider) ========== */}
            <div className="mb-6">
              <div className="d-flex flex-between-center mb-3">
                <h3>Best Offers</h3>
                <Link className="fw-bold d-none d-md-block" to="/products">
                  Explore more<span className="fas fa-chevron-right fs-9 ms-1"></span>
                </Link>
              </div>
              <div className="swiper-theme-container products-slider">
                <div className="swiper swiper theme-slider"
                  data-swiper='{"slidesPerView":1,"spaceBetween":16,"breakpoints":{"450":{"slidesPerView":2,"spaceBetween":16},"576":{"slidesPerView":3,"spaceBetween":20},"768":{"slidesPerView":4,"spaceBetween":20},"992":{"slidesPerView":5,"spaceBetween":20},"1200":{"slidesPerView":6,"spaceBetween":16}}}'>
                  <div className="swiper-wrapper">
                    {bestOfferProducts.map(product => (
                      <div className="swiper-slide" key={'offer-' + product._id}>
                        <ProductCard product={product} showVendor={false} isAuthenticated={isAuthenticated} userRole={user?.role} onWishlistClick={handleWishlistClick} isWishlisted={wishlistItems.includes(product._id)} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="swiper-nav">
                  <div className="swiper-button-next">
                    <span className="fas fa-chevron-right nav-icon"></span>
                  </div>
                  <div className="swiper-button-prev">
                    <span className="fas fa-chevron-left nav-icon"></span>
                  </div>
                </div>
              </div>
              <Link className="fw-bold d-md-none" to="/products">
                Explore more<span className="fas fa-chevron-right fs-9 ms-1"></span>
              </Link>
            </div>

            {/* ========== Become a Member CTA ========== */}
            <div className="row flex-center mb-15 mt-11 gy-6">
              <div className="col-auto">
                <img className="d-dark-none" src="/assets/img/spot-illustrations/light_30.png" alt="" width="305" />
                <img className="d-light-none" src="/assets/img/spot-illustrations/dark_30.png" alt="" width="305" />
              </div>
              <div className="col-auto">
                <div className="text-center text-lg-start">
                  <h3 className="text-body-highlight mb-2">
                    <span className="fw-semibold">Want to have the </span>ultimate
                    <br className="d-md-none" />customer experience?
                  </h3>
                  <h1 className="display-3 fw-semibold mb-4">
                    Become a
                    <span className="text-primary fw-bolder"> member </span>today!
                  </h1>
                  <Link className="btn btn-lg btn-primary px-7" to="/register">
                    Sign up<span className="fas fa-chevron-right ms-2 fs-9"></span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Support Chat Widget */}
      <div className="support-chat-container">
        <div className="container-fluid support-chat">
          <div className="card bg-body-emphasis">
            <div className="card-header d-flex flex-between-center px-4 py-3 border-bottom border-translucent">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                Demo widget<span className="fa-solid fa-circle text-success fs-11"></span>
              </h5>
              <div className="btn-reveal-trigger">
                <button className="btn btn-link p-0 dropdown-toggle dropdown-caret-none transition-none d-flex" type="button"
                  id="support-chat-dropdown" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup="true"
                  aria-expanded="false" data-bs-reference="parent">
                  <span className="fas fa-ellipsis-h text-body"></span>
                </button>
                <div className="dropdown-menu dropdown-menu-end py-2" aria-labelledby="support-chat-dropdown">
                  <a className="dropdown-item" href="#!">Request a callback</a>
                  <a className="dropdown-item" href="#!">Search in chat</a>
                  <a className="dropdown-item" href="#!">Show history</a>
                  <a className="dropdown-item" href="#!">Report to Admin</a>
                  <a className="dropdown-item btn-support-chat" href="#!">Close Support</a>
                </div>
              </div>
            </div>
            <div className="card-body chat p-0">
              <div className="d-flex flex-column-reverse scrollbar h-100 p-3">
                <div className="text-end mt-6">
                  <a className="mb-2 d-inline-flex align-items-center text-decoration-none text-body-emphasis bg-body-hover rounded-pill border border-primary py-2 ps-4 pe-3" href="#!">
                    <p className="mb-0 fw-semibold fs-9">I need help with something</p>
                    <span className="fa-solid fa-paper-plane text-primary fs-9 ms-3"></span>
                  </a>
                  <a className="mb-2 d-inline-flex align-items-center text-decoration-none text-body-emphasis bg-body-hover rounded-pill border border-primary py-2 ps-4 pe-3" href="#!">
                    <p className="mb-0 fw-semibold fs-9">How do I place an order?</p>
                    <span className="fa-solid fa-paper-plane text-primary fs-9 ms-3"></span>
                  </a>
                  <a className="false d-inline-flex align-items-center text-decoration-none text-body-emphasis bg-body-hover rounded-pill border border-primary py-2 ps-4 pe-3" href="#!">
                    <p className="mb-0 fw-semibold fs-9">My payment method not working</p>
                    <span className="fa-solid fa-paper-plane text-primary fs-9 ms-3"></span>
                  </a>
                </div>
                <div className="text-center mt-auto">
                  <div className="avatar avatar-3xl status-online">
                    <img className="rounded-circle border border-3 border-light-subtle" src="/assets/img/team/30.webp" alt="" />
                  </div>
                  <h5 className="mt-2 mb-3">Support</h5>
                  <p className="text-center text-body-emphasis mb-0">
                    Ask us anything – we'll get back to you here or by email within 24 hours.
                  </p>
                </div>
              </div>
            </div>
            <div className="card-footer d-flex align-items-center gap-2 border-top border-translucent ps-3 pe-4 py-3">
              <div className="d-flex align-items-center flex-1 gap-3 border border-translucent rounded-pill px-4">
                <input className="form-control outline-none border-0 flex-1 fs-9 px-0" type="text" placeholder="Write message" />
                <label className="btn btn-link d-flex p-0 text-body-quaternary fs-9 border-0" htmlFor="supportChatPhotos">
                  <span className="fa-solid fa-image"></span>
                </label>
                <input className="d-none" type="file" accept="image/*" id="supportChatPhotos" />
                <label className="btn btn-link d-flex p-0 text-body-quaternary fs-9 border-0" htmlFor="supportChatAttachment">
                  <span className="fa-solid fa-paperclip"></span>
                </label>
                <input className="d-none" type="file" id="supportChatAttachment" />
              </div>
              <button className="btn p-0 border-0 send-btn">
                <span className="fa-solid fa-paper-plane fs-9"></span>
              </button>
            </div>
          </div>
        </div>
        <button className="btn btn-support-chat p-0 border border-translucent">
          <span className="fs-8 btn-text text-primary text-nowrap">Chat demo</span>
          <span className="ping-icon-wrapper mt-n4 ms-n6 mt-sm-0 ms-sm-2 position-absolute position-sm-relative">
            <span className="ping-icon-bg"></span>
            <span className="fa-solid fa-circle ping-icon"></span>
          </span>
          <span className="fa-solid fa-headset text-primary fs-8 d-sm-none"></span>
          <span className="fa-solid fa-chevron-down text-primary fs-7"></span>
        </button>
      </div>
    </>
  );
}
