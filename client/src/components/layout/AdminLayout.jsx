import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { toast } from 'react-toastify'
import { useEffect, useState } from 'react'

const adminNavSections = [
  {
    label: 'Dashboard',
    items: [
      { path: '/admin', label: 'Overview', icon: 'fas fa-chart-pie', exact: true },
    ]
  },
  {
    label: 'Store Management',
    items: [
      { path: '/admin/vendors', label: 'Vendors', icon: 'fas fa-store' },
      { path: '/admin/products', label: 'Products', icon: 'fas fa-box-open' },
      { path: '/admin/categories', label: 'Categories', icon: 'fas fa-th-large' },
      { path: '/admin/orders', label: 'Orders', icon: 'fas fa-shopping-bag' },
      { path: '/admin/customers', label: 'Customers', icon: 'fas fa-users' },
    ]
  },
  {
    label: 'Finance',
    items: [
      { path: '/admin/payouts', label: 'Payouts', icon: 'fas fa-credit-card' },
      { path: '/admin/refunds', label: 'Refunds', icon: 'fas fa-undo-alt' },
      { path: '/admin/coupons', label: 'Coupons', icon: 'fas fa-tag' },
      { path: '/admin/commission', label: 'Commission', icon: 'fas fa-percent' },
    ]
  },
  {
    label: 'Feedback',
    items: [
      { path: '/admin/reviews', label: 'Reviews', icon: 'fas fa-star' },
    ]
  }
]

export default function AdminLayout({ children }) {
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
      if (profileDropdown && !e.target.closest('.admin-profile-dropdown')) {
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

  const avatarSrc = user?.avatar || '/assets/img/team/avatar.webp'

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        className="d-flex flex-column bg-body-emphasis border-end border-translucent"
        style={{
          width: sidebarCollapsed ? 72 : 260,
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
          <Link to="/admin" className="d-flex align-items-center text-decoration-none flex-nowrap overflow-hidden">
            <img src="/assets/img/icons/logo.png" alt="ShopZone" width="27" style={{ minWidth: 27 }} />
            {!sidebarCollapsed && (
              <div className="ms-2 d-flex align-items-baseline flex-nowrap">
                <span className="fw-bolder text-body-emphasis fs-7 text-nowrap">ShopZone</span>
                <span className="badge badge-phoenix badge-phoenix-danger ms-2 fs-10">Admin</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-3 scrollbar">
          {adminNavSections.map((section, si) => (
            <div key={si} className="mb-3">
              {!sidebarCollapsed && (
                <p className="text-body-quaternary text-uppercase fw-bolder ls-2 fs-11 px-3 mb-2">{section.label}</p>
              )}
              {si > 0 && <hr className="mx-3 my-0 mb-2 border-translucent" />}
              <ul className="nav flex-column gap-1 px-2">
                {section.items.map((item) => (
                  <li className="nav-item" key={item.path}>
                    <Link
                      to={item.path}
                      className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 ${
                        isActive(item)
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
          ))}
        </div>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3 border-top border-translucent">
            <div className="d-flex align-items-center">
              <div className="avatar avatar-s">
                <img className="rounded-circle" src={avatarSrc} alt="" style={{ width: 32, height: 32, objectFit: 'cover' }} />
              </div>
              <div className="ms-2 flex-1 overflow-hidden">
                <h6 className="mb-0 text-body-emphasis fs-10 text-truncate">{user?.name || 'Admin'}</h6>
                <p className="mb-0 text-body-quaternary fs-11 text-truncate">{user?.email || 'admin@shopzone.com'}</p>
              </div>
              <button className="btn btn-sm btn-phoenix-secondary p-1 ms-auto" onClick={handleLogout} title="Logout">
                <span className="fas fa-sign-out-alt fs-9"></span>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 d-flex flex-column" style={{ minWidth: 0 }}>
        {/* Top Navbar */}
        <nav className="navbar navbar-expand bg-body-emphasis border-bottom border-translucent px-4" style={{ height: 64, position: 'sticky', top: 0, zIndex: 1010 }}>
          <div className="d-flex align-items-center w-100">
            {/* Hamburger */}
            <button className="btn btn-sm btn-phoenix-secondary me-3" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <span className="fas fa-bars"></span>
            </button>

            {/* Search */}
            <div className="search-box d-none d-md-block" style={{ maxWidth: 300, flex: 1 }}>
              <form className="position-relative">
                <input className="form-control form-control-sm search-input bg-body-highlight border-translucent" type="search" placeholder="Search..." aria-label="Search" />
                <span className="fas fa-search search-box-icon"></span>
              </form>
            </div>

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
                <span className="fas fa-external-link-alt fs-10"></span>
                <span className="fs-10">Visit Store</span>
              </Link>

              {/* Profile Dropdown */}
              <div className="position-relative admin-profile-dropdown">
                <button
                  className="btn btn-link p-0 d-flex align-items-center gap-2 text-decoration-none"
                  onClick={(e) => { e.stopPropagation(); setProfileDropdown(!profileDropdown) }}
                >
                  <div className="avatar avatar-m">
                    <img className="rounded-circle" src={avatarSrc} alt="" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                  </div>
                  <div className="d-none d-md-block text-start">
                    <h6 className="mb-0 text-body-emphasis fs-10 lh-1">{user?.name || 'Admin'}</h6>
                    <span className="text-body-quaternary fs-11">Administrator</span>
                  </div>
                  <span className="fas fa-chevron-down text-body-quaternary fs-11 ms-1 d-none d-md-block"></span>
                </button>
                {profileDropdown && (
                  <div className="dropdown-menu dropdown-menu-end show shadow-lg border border-translucent py-2" style={{ position: 'absolute', right: 0, top: 44, minWidth: 220 }}>
                    <div className="px-3 py-2 border-bottom border-translucent">
                      <div className="d-flex align-items-center gap-2">
                        <img className="rounded-circle" src={avatarSrc} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                        <div>
                          <h6 className="mb-0 text-body-emphasis fs-9">{user?.name || 'Admin'}</h6>
                          <p className="mb-0 text-body-tertiary fs-10">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <Link className="dropdown-item py-2 fs-9" to="/profile" onClick={() => setProfileDropdown(false)}>
                      <span className="fas fa-user me-2 text-body-quaternary"></span>My Profile
                    </Link>
                    <Link className="dropdown-item py-2 fs-9" to="/admin" onClick={() => setProfileDropdown(false)}>
                      <span className="fas fa-chart-pie me-2 text-body-quaternary"></span>Dashboard
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
