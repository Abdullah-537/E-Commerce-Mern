import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { toast } from 'react-toastify'
import { useEffect, useState } from 'react'
import api from '../../store/api/baseApi'
import NotificationDropdown from './NotificationDropdown'
import Logo from '../common/Logo'
import { getAvatarColor } from '../../utils/avatarHelper'


const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: 'fas fa-chart-pie', exact: true },
  { path: '/admin/vendors', label: 'Vendors', icon: 'fas fa-store' },
  { path: '/admin/products', label: 'Products', icon: 'fas fa-box-open' },
  { path: '/admin/categories', label: 'Categories', icon: 'fas fa-th-large' },
  { path: '/admin/orders', label: 'Orders', icon: 'fas fa-shopping-bag' },
  { path: '/admin/customers', label: 'Customers', icon: 'fas fa-users' },
  { path: '/admin/payouts', label: 'Payouts', icon: 'fas fa-credit-card' },
  { path: '/admin/refunds', label: 'Refunds', icon: 'fas fa-undo-alt' },
  { path: '/admin/coupons', label: 'Coupons', icon: 'fas fa-tag' },
  { path: '/admin/commission', label: 'Commission', icon: 'fas fa-percent' },
  { path: '/admin/complaints', label: 'Complaints', icon: 'fas fa-flag' },
]

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [isDark, setIsDark] = useState(localStorage.getItem('phoenixTheme') === 'dark')
  const [profileDropdown, setProfileDropdown] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const currentTheme = localStorage.getItem('phoenixTheme')
    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-bs-theme', 'dark')
      setIsDark(true)
    }
  }, [])

  // Fetch pending vendor notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/vendor/pending')
        const pending = res.data?.data || []
        setNotifications(pending.map(v => ({
          id: v._id,
          message: `New vendor application: ${v.businessName}`,
          time: new Date(v.createdAt).toLocaleDateString(),
          type: 'vendor'
        })))
      } catch (e) {}
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
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
      if (profileDropdown && !e.target.closest('.admin-profile-dropdown')) {
        setProfileDropdown(false)
      }
      if (showNotifications && !e.target.closest('.admin-notif-dropdown')) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [profileDropdown, showNotifications])

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname.startsWith(item.path)
  }

  const avatarSrc = user?.avatar

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg bg-body-emphasis border-bottom border-translucent px-3 px-lg-4" style={{ position: 'sticky', top: 0, zIndex: 1030 }}>
        <div className="container-fluid">
          {/* Logo */}
          <Logo size="sm" link={true} adminBadge={true} />


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
              {adminNavItems.map((item) => (
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
                <span className="fas fa-external-link-alt fs-10"></span>
                <span className="fs-10">Visit Store</span>
              </Link>

              {/* Profile Dropdown */}
              <div className="position-relative admin-profile-dropdown">
                <button
                  className="btn btn-link p-0 d-flex align-items-center gap-2 text-decoration-none"
                  onClick={(e) => { e.stopPropagation(); setProfileDropdown(!profileDropdown) }}
                >
                  <div className="d-flex align-items-center justify-content-center rounded-circle border border-translucent overflow-hidden" style={{ width: 38, height: 38 }}>
                    {avatarSrc ? (
                      <img className="rounded-circle w-100 h-100" src={avatarSrc} alt="" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className={`rounded-circle bg-${getAvatarColor(user?.name)}-subtle text-${getAvatarColor(user?.name)} fw-bold w-100 h-100 d-flex align-items-center justify-content-center`}>
                        <span className="fs-9">{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                      </div>
                    )}
                  </div>
                  <div className="d-none d-md-block text-start">
                    <h6 className="mb-0 text-body-emphasis fs-10 lh-1">{user?.name || 'Admin'}</h6>
                    <span className="text-body-quaternary fs-11">Administrator</span>
                  </div>
                  <span className="fas fa-chevron-down text-body-quaternary fs-11 ms-1 d-none d-md-block"></span>
                </button>
                {profileDropdown && (
                  <div className="dropdown-menu dropdown-menu-end show shadow-lg border border-translucent py-2" style={{ position: 'absolute', right: '0', left: 'auto', top: 44, minWidth: 220, transform: 'translateX(-10px)' }}>
                    <div className="px-3 py-2 border-bottom border-translucent">
                      <div className="d-flex align-items-center gap-2">
                        <img className="rounded-circle" src={avatarSrc} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                        <div>
                          <h6 className="mb-0 text-body-emphasis fs-9">{user?.name || 'Admin'}</h6>
                          <p className="mb-0 text-body-tertiary fs-10">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <Link className="dropdown-item py-2 fs-9" to="/admin" onClick={() => setProfileDropdown(false)}>
                      <span className="fas fa-chart-pie me-2 text-body-quaternary"></span>Dashboard
                    </Link>
                    <Link className="dropdown-item py-2 fs-9" to="/profile" onClick={() => setProfileDropdown(false)}>
                      <span className="fas fa-user-cog me-2 text-body-quaternary"></span>Profile Settings
                    </Link>
                    <Link className="dropdown-item py-2 fs-9" to="/" onClick={() => setProfileDropdown(false)}>
                      <span className="fas fa-store me-2 text-body-quaternary"></span>Visit Store
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item py-2 fs-9 text-danger" onClick={handleLogout}>
                      <span className="fas fa-sign-out-alt me-2"></span>Sign out
                    </button>
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
