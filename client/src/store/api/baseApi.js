import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
        localStorage.setItem('accessToken', data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api