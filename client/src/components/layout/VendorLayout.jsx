import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { toast } from 'react-toastify'
import { useEffect, useState } from 'react'

const navItems = [
  { path: '/vendor', label: 'Dashboard', icon: 'fas fa-chart-pie' },
  { path: '/vendor/products', label: 'My Products', icon: 'fas fa-box-open' },
  { path: '/vendor/orders', label: 'My Orders', icon: 'fas fa-shopping-bag' },
  { path: '/vendor/earnings', label: 'Earnings', icon: 'fas fa-dollar-sign' },
  { path: '/vendor/payouts', label: 'Payouts', icon: 'fas fa-credit-card' },
  { path: '/vendor/refunds', label: 'Refunds', icon: 'fas fa-undo-alt' },
  { path: '/vendor/reviews', label: 'Reviews', icon: 'fas fa-star' },
  { path: '/vendor/profile', label: 'Profile', icon: 'fas fa-user-circle' },
  { path: '/vendor/settings', label: 'Settings', icon: 'fas fa-cog' },
]

export default function VendorLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(localStorage.getItem('phoenixTheme') === 'dark')
  const [profileDropdown, setProfileDropdown] = useState(false)

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

  const handleLogout = () => {
    dispatch(logout())
    navigate('/signout')
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

  const isActive = (path) => {
    if (path === '/vendor') return location.pathname === '/vendor'
    return location.pathname.startsWith(path)
  }

  const avatarSrc = user?.avatar || user?.vendor?.logo || '/assets/img/team/avatar.webp'

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        className="d-flex flex-column bg-body-emphasis border-end border-translucent"
        style={{
          width: sidebarCollapsed ? 72 : 256,
          minHeight: '100vh',
          position: 'sticky',
          top: 0,
          transition: 'width 0.2s ease',
          zIndex: 1020,
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div className="d-flex align-items-center px-3 border-bottom border-translucent" style={{ height: 64 }}>
          <Link to="/vendor" className="d-flex align-items-center text-decoration-none flex-nowrap overflow-hidden">
            <img src="/assets/img/icons/logo.png" alt="ShopZone" width="27" style={{ minWidth: 27 }} />
            {!sidebarCollapsed && (
              <div className="ms-2 d-flex align-items-baseline flex-nowrap">
                <span className="fw-bolder text-body-emphasis fs-7 text-nowrap">ShopZone</span>
                <span className="badge badge-phoenix badge-phoenix-success ms-2 fs-10">Vendor</span>
              </div>
            )}
          </Link>
        </div>

        {/* Vendor Info Card */}
        {!sidebarCollapsed && user?.vendor && (
          <div className="px-3 py-3 border-bottom border-translucent">
            <div className="d-flex align-items-center">
              <div className="avatar avatar-l">
                <img className="rounded-circle" src={avatarSrc} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} />
              </div>
              <div className="ms-2 flex-1 overflow-hidden">
                <h6 className="mb-0 text-body-emphasis text-truncate fs-9">{user.vendor.businessName}</h6>
                <span className={`badge bg-${user.vendor.status === 'approved' ? 'success' : user.vendor.status === 'pending' ? 'warning' : 'danger'} mt-1 fs-11`}>
                  {user.vendor.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-auto py-3 scrollbar">
          {!sidebarCollapsed && (
            <p className="text-body-quaternary text-uppercase fw-bolder ls-2 fs-11 px-3 mb-2">Menu</p>
          )}
          <ul className="nav flex-column gap-1 px-2">
            {navItems.map((item) => (
              <li className="nav-item" key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 ${
                    isActive(item.path)
                      ? 'bg-primary bg-opacity-10 text-primary fw-semibold'
                      : 'text-body-tertiary'
                  }`}
                  style={{ transition: 'all 0.15s ease' }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className={`${item.icon} fs-9`} style={{ width: 20, textAlign: 'center' }}></span>
                  {!sidebarCollapsed && <span className="nav-link-text fs-9">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3 border-top border-translucent">
            <div className="d-flex align-items-center">
              <div className="avatar avatar-s">
                <img className="rounded-circle" src={avatarSrc} alt="" style={{ width: 32, height: 32, objectFit: 'cover' }} />
              </div>
              <div className="ms-2 flex-1 overflow-hidden">
                <h6 className="mb-0 text-body-emphasis fs-10 text-truncate">{user?.name || 'Vendor'}</h6>
                <p className="mb-0 text-body-quaternary fs-11 text-truncate">{user?.email}</p>
              </div>
              <button className="btn btn-sm btn-phoenix-secondary p-1 ms-auto" onClick={handleLogout} title="Logout">
                <span className="fas fa-sign-out-alt fs-9"></span>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 d-flex flex-column" style={{ minWidth: 0 }}>
        {/* Top Navbar */}
        <nav className="navbar navbar-expand bg-body-emphasis border-bottom border-translucent px-4" style={{ height: 64, position: 'sticky', top: 0, zIndex: 1010 }}>
          <div className="d-flex align-items-center w-100">
            {/* Hamburger */}
            <button className="btn btn-sm btn-phoenix-secondary me-3" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <span className="fas fa-bars"></span>
            </button>

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="d-none d-md-block">
              <ol className="breadcrumb mb-0 fs-9">
                <li className="breadcrumb-item"><Link to="/" className="text-body-tertiary">Home</Link></li>
                <li className="breadcrumb-item active text-body-emphasis" aria-current="page">Vendor Panel</li>
              </ol>
            </nav>

            {/* Right Actions */}
            <div className="ms-auto d-flex align-items-center gap-2">
              {/* Theme Toggle */}
              <button className="btn btn-sm btn-phoenix-secondary" onClick={handleThemeToggle} title="Toggle theme">
                <span className={`fas fa-${isDark ? 'sun' : 'moon'}`}></span>
              </button>

              {/* Notifications */}
              <button className="btn btn-sm btn-phoenix-secondary position-relative">
                <span className="fas fa-bell"></span>
              </button>

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
                  <div className="avatar avatar-m">
                    <img className="rounded-circle" src={avatarSrc} alt="" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                  </div>
                  <div className="d-none d-md-block text-start">
                    <h6 className="mb-0 text-body-emphasis fs-10 lh-1">{user?.vendor?.businessName || user?.name || 'Vendor'}</h6>
                    <span className="text-body-quaternary fs-11">{user?.email}</span>
                  </div>
                  <span className="fas fa-chevron-down text-body-quaternary fs-11 ms-1 d-none d-md-block"></span>
                </button>
                {profileDropdown && (
                  <div className="dropdown-menu dropdown-menu-end show shadow-lg border border-translucent py-2" style={{ position: 'absolute', right: 0, top: 44, minWidth: 220 }}>
                    <div className="px-3 py-2 border-bottom border-translucent">
                      <div className="d-flex align-items-center gap-2">
                        <img className="rounded-circle" src={avatarSrc} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                        <div>
                          <h6 className="mb-0 text-body-emphasis fs-9">{user?.name}</h6>
                          <p className="mb-0 text-body-tertiary fs-10">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <Link className="dropdown-item py-2 fs-9" to="/vendor/profile" onClick={() => setProfileDropdown(false)}>
                      <span className="fas fa-user me-2 text-body-quaternary"></span>My Profile
                    </Link>
                    <Link className="dropdown-item py-2 fs-9" to="/vendor/settings" onClick={() => setProfileDropdown(false)}>
                      <span className="fas fa-cog me-2 text-body-quaternary"></span>Settings
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
        </nav>

        {/* Page Content */}
        <div className="flex-1 p-4 bg-body" style={{ overflow: 'auto' }}>
          {children || <Outlet />}
        </div>

        {/* Footer */}
        <footer className="border-top border-translucent py-3 px-4">
          <div className="d-flex justify-content-between align-items-center">
            <p className="mb-0 text-body-tertiary fs-10">Thank you for creating with ShopZone <span className="mx-1">|</span> 2026 Â© <Link to="/">ShopZone</Link></p>
            <p className="mb-0 text-body-quaternary fs-10">v1.0.0</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
