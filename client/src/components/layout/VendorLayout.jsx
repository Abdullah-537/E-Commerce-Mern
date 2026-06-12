import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { toast } from 'react-toastify'
import { useEffect, useState } from 'react'
import api from '../../store/api/baseApi'
import NotificationDropdown from './NotificationDropdown'
import Logo from '../common/Logo'
import { getAvatarColor } from '../../utils/avatarHelper'


const vendorNavItems = [
  { path: '/vendor', label: 'Dashboard', icon: 'fas fa-chart-pie', exact: true },
  { path: '/vendor/products', label: 'My Products', icon: 'fas fa-box-open' },
  { path: '/vendor/orders', label: 'Orders', icon: 'fas fa-shopping-bag' },
  { path: '/vendor/earnings', label: 'Earnings', icon: 'fas fa-dollar-sign' },
  { path: '/vendor/payouts', label: 'Payouts', icon: 'fas fa-credit-card' },
  { path: '/vendor/refunds', label: 'Refunds', icon: 'fas fa-undo-alt' },
  { path: '/vendor/reviews', label: 'Reviews', icon: 'fas fa-star' },
  { path: '/vendor/profile', label: 'Profile', icon: 'fas fa-user-circle' },
]

export default function VendorLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [isDark, setIsDark] = useState(localStorage.getItem('phoenixTheme') === 'dark')
  const [profileDropdown, setProfileDropdown] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const currentTheme = localStorage.getItem('phoenixTheme')
    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-bs-theme', 'dark')
      setIsDark(true)
    }
  }, [])

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    document.documentElement.setAttribute('data-bs-theme', newTheme)
    localStorage.setItem('phoenixTheme', newTheme)
  }

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.warn('Backend logout failed');
    } finally {
      dispatch(logout())
      navigate('/signout')
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdown && !e.target.closest('.vendor-profile-dropdown')) {
        setProfileDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [profileDropdown])

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname.startsWith(item.path)
  }

  const avatarSrc = user?.avatar || user?.vendor?.logo
  const getInitial = () => (user?.vendor?.businessName || user?.name || 'V').charAt(0).toUpperCase()

  const renderAvatar = (size = 36) => {
    if (avatarSrc) {
      return <img className="rounded-circle flex-shrink-0" src={avatarSrc} alt="" style={{ width: size, height: size, minWidth: size, minHeight: size, objectFit: 'cover' }} />
    }
    const colorName = user?.vendor?.businessName || user?.name || 'V'
    return (
      <div className={`rounded-circle bg-${getAvatarColor(colorName)}-subtle text-${getAvatarColor(colorName)} d-flex align-items-center justify-content-center fw-bold flex-shrink-0`} style={{ width: size, height: size, minWidth: size, minHeight: size, fontSize: size * 0.4 }}>
        {getInitial()}
      </div>
    )
  }

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg bg-body-emphasis border-bottom border-translucent px-3 px-lg-4" style={{ position: 'sticky', top: 0, zIndex: 1030 }}>
        <div className="container-fluid">
          {/* Logo */}
          <Logo size="sm" link={true} vendorBadge={true} />


          {/* Hamburger for mobile */}
          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            <span className="fas fa-bars text-body-emphasis"></span>
          </button>

          {/* Collapsible nav */}
          <div className={`collapse navbar-collapse ${mobileOpen ? 'show' : ''}`}>
            {/* Nav Items */}
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
              {vendorNavItems.map((item) => (
                <li className="nav-item" key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link d-flex align-items-center gap-1 px-2 py-2 rounded-3 fs-9 ${
                      isActive(item) ? 'text-primary fw-semibold' : 'text-body-tertiary'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className={`${item.icon} fs-10`}></span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Right Actions */}
            <div className="d-flex align-items-center gap-2">
              {/* Theme Toggle */}
              <button className="btn btn-sm btn-phoenix-secondary" onClick={handleThemeToggle} title="Toggle theme">
                <span className={`fas fa-${isDark ? 'sun' : 'moon'}`}></span>
              </button>

              <ul className="navbar-nav navbar-nav-icons flex-row">
                <NotificationDropdown />
              </ul>

              {/* Visit Store */}
              <Link to="/" className="btn btn-sm btn-phoenix-primary d-none d-lg-inline-flex align-items-center gap-1">
                <span className="fas fa-store fs-10"></span>
                <span className="fs-10">Visit Store</span>
              </Link>

              {/* Profile Dropdown */}
              <div className="position-relative vendor-profile-dropdown">
                <button
                  className="btn btn-link p-0 d-flex align-items-center gap-2 text-decoration-none"
                  onClick={(e) => { e.stopPropagation(); setProfileDropdown(!profileDropdown) }}
                >
                  <div className="avatar avatar-m overflow-hidden">
                    {renderAvatar(36)}
                  </div>
                  <div className="d-none d-md-block text-start">
                    <h6 className="mb-0 text-body-emphasis fs-10 lh-1">{user?.vendor?.businessName || user?.name || 'Vendor'}</h6>
                    <span className="text-body-quaternary fs-11">Vendor Panel</span>
                  </div>
                  <span className="fas fa-chevron-down text-body-quaternary fs-11 ms-1 d-none d-md-block"></span>
                </button>
                {profileDropdown && (
                  <div className="dropdown-menu dropdown-menu-end show shadow-lg border border-translucent py-3" style={{ position: 'absolute', right: '0', left: 'auto', top: 44, minWidth: 240, transform: 'translateX(-10px)' }}>
                    <div className="d-flex flex-column align-items-center px-4 py-3">
                      <div className="mb-2">
                        {renderAvatar(64)}
                      </div>
                      <h5 className="mb-0 text-body-emphasis">{user?.vendor?.businessName || user?.name || 'Vendor'}</h5>
                      <p className="mb-0 text-body-tertiary fs-10">{user?.email}</p>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    {location.pathname !== '/vendor' && (
                      <Link className="dropdown-item py-2" to="/vendor" onClick={() => setProfileDropdown(false)}>
                        Vendor Dashboard
                      </Link>
                    )}
                    <Link className="dropdown-item py-2 d-flex align-items-center" to="/vendor/profile" onClick={() => setProfileDropdown(false)}>
                      <span className="far fa-user me-2 fs-9"></span>Profile
                    </Link>
                    <Link className="dropdown-item py-2 d-flex align-items-center" to="/" onClick={() => setProfileDropdown(false)}>
                      <span className="fas fa-store me-2 fs-9 text-body-tertiary"></span>Visit Store
                    </Link>
                    
                    <div className="dropdown-divider"></div>
                    
                    <div className="px-3 pt-2">
                      <button className="btn btn-phoenix-secondary w-100 d-flex justify-content-center align-items-center" onClick={handleLogout}>
                        <span className="fas fa-sign-out-alt me-2"></span>Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="flex-1 bg-body">
        <div className="container-fluid p-4">
          {children || <Outlet />}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-top border-translucent py-3 px-4">
        <div className="d-flex justify-content-between align-items-center">
          <p className="mb-0 text-body-tertiary fs-10">Thank you for creating with ShopZone <span className="mx-1">|</span> 2026 © <Link to="/">ShopZone</Link></p>
          <p className="mb-0 text-body-quaternary fs-10">v1.0.0</p>
        </div>
      </footer>
    </div>
  )
}
