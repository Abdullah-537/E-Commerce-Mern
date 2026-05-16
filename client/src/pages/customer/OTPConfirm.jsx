import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCart } from '../../store/slices/cartSlice'
import api from '../../store/api/baseApi'
import { toast } from 'react-toastify'

export default function OTPConfirm() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(180)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const orderId = location.state?.orderId

  useEffect(() => {
    if (!orderId) {
      toast.error('No order selected for verification')
      navigate('/')
    }
  }, [orderId, navigate])

  useEffect(() => {
    if (timer > 0) setTimeout(() => setTimer(timer - 1), 1000)
  }, [timer])

  const handleChange = (i, val) => {
    const newCode = [...code]
    newCode[i] = val.slice(-1)
    setCode(newCode)
    
    // Move focus forward if value entered
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`).focus()
    }
  }

  const handleKeyDown = (i, e) => {
    // Move focus back on backspace if current field is empty
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`).focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otp = code.join('').trim()
    if (otp.length < 6) return
    
    setLoading(true)
    try {
      await api.post('/orders/verify-otp', { orderId, code: otp })
      dispatch(setCart({ items: [], totalItems: 0, totalPrice: 0 }))
      toast.success('Order confirmed!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    try {
      await api.post('/orders/resend-otp', { orderId })
      setTimer(180)
      toast.success('OTP resent')
    } catch (err) {
      toast.error('Failed to resend')
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="card shadow-sm" style={{ width: 400 }}>
        <div className="card-body p-4 text-center">
          <i className="fas fa-lock fa-3x text-primary mb-3"></i>
          <h4>Verify Order</h4>
          <p className="text-muted">Enter the 6-digit code sent to your WhatsApp</p>
          <form onSubmit={handleSubmit}>
            <div className="d-flex justify-content-center gap-2 mb-4">
              {code.map((c, i) => (
                <input key={i} id={`otp-${i}`} type="text" className="form-control text-center"
                  style={{ width: 50, fontSize: 24 }} maxLength={1} value={c}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)} />
              ))}
            </div>
            <div className="mb-3 text-muted">
              {timer > 0 ? `Resend in ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : (
                <button type="button" className="btn btn-link" onClick={resend}>Resend OTP</button>
              )}
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading || code.join('').length < 6}>
              {loading ? 'Verifying...' : 'Confirm Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}