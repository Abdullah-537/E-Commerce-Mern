import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

export default function VendorRoute({ children }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/vendor/login" replace />
  }

  if (user?.role !== 'vendor') {
    toast.error('Vendor access required')
    return <Navigate to="/" replace />
  }

  // Check vendor status from user object (would need to be set after login)
  // For now, we'll allow access - can add status check later

  return children
}