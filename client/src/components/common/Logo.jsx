import { Link } from 'react-router-dom'

export default function Logo({ size = 'sm', link = true, textOnly = false }) {
  const logoWidth = size === 'sm' ? 27 : size === 'lg' ? 40 : 32
  
  const content = (
    <div className="d-flex align-items-center">
      {!textOnly && (
        <img src="/assets/img/icons/logo.png" alt="phoenix" width={logoWidth} />
      )}
      <p className={`logo-text ms-2 d-none d-sm-block fs-${size === 'sm' ? '8' : size === 'lg' ? '6' : '7'} fw-bold text-body-emphasis mb-0`}>
        ShopZone
      </p>
    </div>
  )

  if (link) {
    return (
      <Link to="/" className="text-decoration-none" style={{ display: 'inline-block' }}>
        {content}
      </Link>
    )
  }

  return content
}
