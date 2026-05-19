import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { setCart } from '../../store/slices/cartSlice'
import api from '../../store/api/baseApi'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import NotificationDropdown from './NotificationDropdown'

export default function CustomerLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { totalItems } = useSelector((state) => state.cart)
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(localStorage.getItem('phoenixTheme') === 'dark');
  const [navCategories, setNavCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      api.get(`/products?search=${encodeURIComponent(searchQuery)}&limit=5`)
        .then(res => setSuggestions(res.data.data.products || []))
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleThemeToggle = (e) => {
    const dark = e.target.checked;
    setIsDark(dark);
    document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
    localStorage.setItem('phoenixTheme', dark ? 'dark' : 'light');
  };

  // Ensure theme is applied on initial load
  useEffect(() => {
    const currentTheme = localStorage.getItem('phoenixTheme');
    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      setIsDark(true);
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      setIsDark(false);
    }
  }, []);

  useEffect(() => {
    if (window.feather) {
      window.feather.replace()
    }
    if (isAuthenticated) {
      api.get('/cart')
        .then(res => dispatch(setCart(res.data.data)))
        .catch(() => {})
    }
    api.get('/categories')
      .then(res => setNavCategories(res.data.data || []))
      .catch(() => {})
  }, [isAuthenticated, dispatch])

  // Re-render feather icons when categories load
  useEffect(() => {
    if (window.feather && navCategories.length > 0) {
      setTimeout(() => window.feather.replace(), 100)
    }
  }, [navCategories])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownOpen && !e.target.closest('.dropdown-profile-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.warn('Backend logout failed, clearing local state anyway');
    } finally {
      dispatch(logout())
      dispatch(setCart({ items: [] }))
      navigate('/signout')
    }
  }

  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      navigate('/cart');
    } else {
      navigate('/login', { state: { from: location } });
    }
  };

  const handleProtectedNav = (e, path) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate('/login', { state: { from: location } });
    }
  };

  return (
    <main className="main" id="top">
      <section className="py-0">
        <div className="container-small">
          <div className="ecommerce-topbar">
            <nav className="navbar navbar-expand-lg navbar-light px-0">
              <div className="row gx-0 gy-2 w-100 flex-between-center">
                <div className="col-auto">
                  <Link className="text-decoration-none" to="/">
                    <div className="d-flex align-items-center"><img src="/assets/img/icons/logo.png" alt="shopzone" width="27" />
                      <h5 className="logo-text ms-2">ShopZone</h5>
                    </div>
                  </Link>
                </div>
                <div className="col-auto order-md-1">
                  <ul className="navbar-nav navbar-nav-icons flex-row me-n2">
                    <li className="nav-item d-flex align-items-center">
                      <div className="theme-control-toggle px-2">
                        <input className="form-check-input ms-0 theme-control-toggle-input" type="checkbox" data-theme-control="phoenixTheme" value="dark" id="themeControlToggle" checked={isDark} onChange={handleThemeToggle} />
                        <label className="mb-0 theme-control-toggle-label theme-control-toggle-light" htmlFor="themeControlToggle" data-bs-toggle="tooltip" data-bs-placement="left" title="Switch theme" style={{height:'32px',width:'32px'}}><span className="icon" data-feather="moon"></span></label>
                        <label className="mb-0 theme-control-toggle-label theme-control-toggle-dark" htmlFor="themeControlToggle" data-bs-toggle="tooltip" data-bs-placement="left" title="Switch theme" style={{height:'32px',width:'32px'}}><span className="icon" data-feather="sun"></span></label>
                      </div>
                    </li>
                    {(!user || (user.role !== 'admin' && user.role !== 'vendor')) && (
                    <li className="nav-item feather-icon-wait" style={{height: '40px'}}>
                      <a className={`nav-link px-2 icon-indicator ${totalItems > 0 ? 'icon-indicator-primary' : ''}`} href="#" onClick={handleCartClick} role="button">
                        <span className="text-body-tertiary" data-feather="shopping-cart" style={{height:'20px',width:'20px'}}></span>
                        {totalItems > 0 && <span className="icon-indicator-number">{totalItems}</span>}
                      </a>
                    </li>
                    )}
                    {isAuthenticated ? <NotificationDropdown /> : (
                      <li className="nav-item dropdown feather-icon-wait" style={{height: '40px'}}>
                        <a className="nav-link px-2 icon-indicator icon-indicator-sm"
                          id="navbarTopDropdownNotification" href="#" role="button" data-bs-toggle="dropdown"
                          data-bs-auto-close="outside" aria-haspopup="true" aria-expanded="false"
                          onClick={(e) => e.preventDefault()}>
                          <span className="text-body-tertiary" data-feather="bell" style={{height:'20px',width:'20px'}}></span>
                        </a>
                      </li>
                    )}
                    <li className="nav-item dropdown feather-icon-wait dropdown-profile-container" style={{height: '40px'}}>
                      <a className="nav-link px-2" id="navbarDropdownUser" href="#" role="button" aria-haspopup="true" aria-expanded={dropdownOpen}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}>
                        <div className="d-flex align-items-center justify-content-center" style={{width: 24, height: 24}}>
                          {isAuthenticated && user?.avatar ? (
                            <img className="rounded-circle w-100 h-100" src={user.avatar} alt="" style={{objectFit: 'cover'}} />
                          ) : (
                            <span className="fas fa-user text-body-tertiary fs-8"></span>
                          )}
                        </div>
                      </a>
                      <div className={`dropdown-menu dropdown-menu-end navbar-dropdown-caret py-0 dropdown-profile shadow border mt-2 ${dropdownOpen ? 'show' : ''}`} aria-labelledby="navbarDropdownUser" data-bs-popper="static">
                        <div className="card position-relative border-0">
                          {isAuthenticated ? (
                            <>
                              <div className="card-body p-0">
                                <div className="text-center pt-4 pb-3">
                                  <div className="avatar avatar-xl ">
                                    {user?.avatar ? (
                                      <img className="rounded-circle" src={user.avatar} alt="" />
                                    ) : (
                                      <div className="avatar-name rounded-circle" style={{width:'100%',height:'100%',fontSize:'1.5rem'}}><span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span></div>
                                    )}
                                  </div>
                                  <h6 className="mt-2 text-body-emphasis">{user?.name || 'User'}</h6>
                                </div>
                              </div>
                              <div className="overflow-auto scrollbar" style={{height: '10rem'}}>
                                <ul className="nav d-flex flex-column mb-2 pb-1">
                                  {user?.role === 'vendor' && (
                                    <li className="nav-item"><Link className="nav-link px-3 d-block" to="/vendor" onClick={() => setDropdownOpen(false)}> <span className="me-2 text-body align-bottom" data-feather="store"></span><span>Vendor Dashboard</span></Link></li>
                                  )}
                                  {user?.role === 'admin' && (
                                    <li className="nav-item"><Link className="nav-link px-3 d-block" to="/admin" onClick={() => setDropdownOpen(false)}> <span className="me-2 text-body align-bottom" data-feather="settings"></span><span>Admin Dashboard</span></Link></li>
                                  )}
                                  <li className="nav-item"><Link className="nav-link px-3 d-block" to="/profile" onClick={() => setDropdownOpen(false)}> <span className="me-2 text-body align-bottom" data-feather="user"></span><span>Profile</span></Link></li>
                                  {(!user || user.role === 'customer') && (
                                    <li className="nav-item"><Link className="nav-link px-3 d-block" to="/wishlist" onClick={() => setDropdownOpen(false)}><span className="me-2 text-body align-bottom" data-feather="heart"></span>Wishlist</Link></li>
                                  )}
                                </ul>
                              </div>
                              <div className="card-footer p-0 border-top border-translucent">
                                <div className="px-3 mt-3 mb-3"> <button className="btn btn-phoenix-secondary d-flex flex-center w-100" onClick={handleLogout}> <span className="me-2" data-feather="log-out"> </span>Sign out</button></div>
                              </div>
                            </>
                          ) : (
                            <div className="card-body p-4 text-center">
                              <h6 className="mb-3">Welcome to ShopZone</h6>
                              <div className="d-flex flex-column gap-2">
                                <Link to="/login" className="btn btn-primary btn-sm" onClick={() => setDropdownOpen(false)}>Sign In</Link>
                                <Link to="/register" className="btn btn-outline-primary btn-sm" onClick={() => setDropdownOpen(false)}>Sign Up</Link>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="col-12 col-md-6 position-relative">
                  <div className="search-box ecommerce-search-box w-100">
                    <form className="position-relative" onSubmit={(e) => {
                      e.preventDefault();
                      if (searchQuery.trim()) {
                        navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                        setSuggestions([]);
                        setSearchQuery('');
                      }
                    }}>
                      <input className="form-control search-input search form-control-sm" type="search" placeholder="Search products..." aria-label="Search" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (searchQuery && suggestions.length > 0) setSuggestions([...suggestions]) }}
                      />
                      <span className="fas fa-search search-box-icon"></span>
                    </form>
                  </div>
                  {suggestions.length > 0 && searchQuery && (
                    <div className="dropdown-menu show w-100 position-absolute mt-1 shadow-sm border-translucent" style={{ zIndex: 1050 }}>
                      <div className="scrollbar" style={{ maxHeight: '300px' }}>
                        {suggestions.map(s => (
                          <button key={s._id} className="dropdown-item d-flex align-items-center py-2" onClick={() => {
                            navigate(`/product/${s._id}`);
                            setSuggestions([]);
                            setSearchQuery('');
                          }}>
                            <img src={s.images?.[0] || '/assets/img/products/1.png'} alt="" style={{ width: 30, height: 30, objectFit: 'cover' }} className="rounded me-2" />
                            <div className="flex-1 text-truncate">
                              <h6 className="mb-0 text-body-highlight text-truncate">{s.name}</h6>
                              <span className="fs-10 text-body-tertiary">PKR {s.salePrice || s.price}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </section>

      <nav className="navbar-responsive-navitems navbar-expand navbar-light bg-body-emphasis justify-content-between">
        <div className="container-small d-flex flex-between-center" data-navbar="data-navbar">
          <div className="dropdown feather-icon-wait">
            <button className="btn text-body ps-0 pe-5 text-nowrap dropdown-toggle dropdown-caret-none" data-category-btn="data-category-btn" data-bs-toggle="dropdown">
              <span className="fas fa-bars me-2"></span>Category
            </button>
            <div className="dropdown-menu border border-translucent py-0 category-dropdown-menu">
              <div className="card border-0 scrollbar" style={{maxHeight: '657px'}}>
                <div className="card-body p-6 pb-3">
                  <div className="row gx-7 gy-5 mb-5">
                    {navCategories.map(cat => {
                      const iconMap = {
                        'electronics': 'monitor', 'fashion': 'watch', 'clothing': 'watch',
                        'home & kitchen': 'home', 'sports': 'globe', 'books': 'book-open',
                        'toys': 'codesandbox', 'music': 'music', 'auto': 'truck',
                      };
                      const catIcon = Object.entries(iconMap).find(([k]) => cat.name.toLowerCase().includes(k))?.[1] || 'grid';
                      return (
                        <div className="col-12 col-sm-6 col-md-4" key={cat._id}>
                          <div className="d-flex align-items-center mb-3">
                            <span className="text-primary me-2" data-feather={catIcon} style={{strokeWidth: 3}}></span>
                            <h6 className="text-body-highlight mb-0 text-nowrap">
                              <Link className="text-body-highlight text-decoration-none" to={`/products?category=${cat._id}`}>{cat.name}</Link>
                            </h6>
                          </div>
                          {cat.children?.length > 0 && (
                            <div className="ms-n2">
                              {cat.children.map(sub => (
                                <Link key={sub._id} className="text-body-emphasis d-block mb-1 text-decoration-none bg-body-highlight-hover px-2 py-1 rounded-2" to={`/products?category=${sub._id}`}>{sub.name}</Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center border-top border-translucent pt-3"><Link className="fw-bold" to="/products">See all Categories<span className="fas fa-angle-right ms-1" data-fa-transform="down-1"></span></Link></div>
                </div>
              </div>
            </div>
          </div>
          <ul className="navbar-nav justify-content-end align-items-center flex-nowrap" style={{overflow: 'hidden', flexWrap: 'nowrap'}}>
            <li className="nav-item" data-nav-item="data-nav-item"><Link className={`nav-link ps-0 ${location.pathname === '/' ? 'active' : ''}`} to="/">Home</Link></li>
            {(!user || user.role === 'customer') && (
              <li className="nav-item" data-nav-item="data-nav-item"><Link className="nav-link text-nowrap" to="/favourite-stores">My Favourite Stores</Link></li>
            )}
            <li className="nav-item" data-nav-item="data-nav-item"><Link className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`} to="/products">Products</Link></li>
            {(!user || user.role === 'customer') && (
              <>
                <li className="nav-item" data-nav-item="data-nav-item"><Link className="nav-link" to="/wishlist">Wishlist</Link></li>
                <li className="nav-item" data-nav-item="data-nav-item"><Link className="nav-link text-nowrap" to="/shipping-info">Shipping Info</Link></li>
              </>
            )}
            {(!user || (user.role !== 'admin' && user.role !== 'vendor')) && (
              <li className="nav-item" data-nav-item="data-nav-item"><Link className="nav-link text-nowrap" to="/vendor/register">Be a vendor</Link></li>
            )}
            {(!user || user.role === 'customer') && (
              <>
                <li className="nav-item" data-nav-item="data-nav-item"><Link className="nav-link text-nowrap" to="/orders">Track order</Link></li>
                <li className="nav-item" data-nav-item="data-nav-item"><Link className="nav-link pe-0" to="/checkout">Checkout</Link></li>
              </>
            )}
          </ul>
        </div>
      </nav>
      
      {children || <Outlet />}

      <section className="bg-body-highlight dark__bg-gray-1100 py-9">
        <div className="container-small">
          <div className="row justify-content-between gy-4">
            <div className="col-12 col-lg-4">
              <div className="d-flex align-items-center mb-3"><img src="/assets/img/icons/logo.png" alt="shopzone" width="27" />
                <h5 className="logo-text ms-2">ShopZone</h5>
              </div>
              <p className="text-body-tertiary mb-1 fw-semibold lh-sm fs-9">ShopZone is an advanced multi-vendor marketplace with fascinating features and amazing layout.</p>
            </div>
            <div className="col-6 col-md-auto">
              <h5 className="fw-bolder mb-3">About ShopZone</h5>
              <div className="d-flex flex-column">
                <a className="text-body-tertiary fw-semibold fs-9 mb-1" href="#">Careers</a>
                <a className="text-body-tertiary fw-semibold fs-9 mb-1" href="#">Affiliate Program</a>
                <a className="text-body-tertiary fw-semibold fs-9 mb-1" href="#">Privacy Policy</a>
                <a className="text-body-tertiary fw-semibold fs-9 mb-1" href="#">Terms &amp; Conditions</a>
              </div>
            </div>
            <div className="col-6 col-md-auto">
              <h5 className="fw-bolder mb-3">Customer Service</h5>
              <div className="d-flex flex-column">
                <a className="text-body-tertiary fw-semibold fs-9 mb-1" href="#">Help Desk</a>
                <a className="text-body-tertiary fw-semibold fs-9 mb-1" href="#">Support, 24/7</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer position-relative">
        <div className="row g-0 justify-content-between align-items-center h-100">
          <div className="col-12 col-sm-auto text-center">
            <p className="mb-0 mt-2 mt-sm-0 text-body">Thank you for creating with ShopZone<span className="d-none d-sm-inline-block"></span><span className="d-none d-sm-inline-block mx-1">|</span><br className="d-sm-none" />2026 &copy;<Link className="mx-1" to="/">ShopZone</Link></p>
          </div>
          <div className="col-12 col-sm-auto text-center">
            <p className="mb-0 text-body-tertiary text-opacity-85">v1.0.0</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
