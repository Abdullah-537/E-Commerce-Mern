import { Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

const accountLinks = [
  { path: '/profile', label: 'My Profile', icon: 'fas fa-user' },
  { path: '/orders', label: 'My Orders', icon: 'fas fa-shopping-bag' },
  { path: '/wishlist', label: 'Wishlist', icon: 'fas fa-heart' },
  { path: '/shipping-info', label: 'Shipping Info', icon: 'fas fa-truck' },
  { path: '/favourite-stores', label: 'Favourite Stores', icon: 'fas fa-store' },
]

export default function AccountSidebar() {
  const location = useLocation()
  const { user } = useSelector(state => state.auth)

  const avatarSrc = user?.avatar || '/assets/img/team/avatar.webp'

  return (
    <div className="card border border-translucent mb-4">
      <div className="card-body">
        {/* User Info */}
        <div className="d-flex align-items-center mb-4 pb-3 border-bottom border-translucent">
          <div className="avatar avatar-xl me-3">
            <img className="rounded-circle" src={avatarSrc} alt="" style={{ width: 56, height: 56, objectFit: 'cover' }} />
          </div>
          <div>
            <h6 className="mb-0 text-body-emphasis">{user?.name || 'User'}</h6>
            <p className="text-body-tertiary fs-10 mb-0">{user?.email}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="account-sidebar">
          <ul className="nav flex-column gap-1">
            {accountLinks.map(link => (
              <li className="nav-item" key={link.path}>
                <Link
                  to={link.path}
                  className={`nav-link d-flex align-items-center gap-2 ${
                    location.pathname === link.path ? 'active' : ''
                  }`}
                >
                  <span className={`${link.icon} fs-9`} style={{ width: 18, textAlign: 'center' }}></span>
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
