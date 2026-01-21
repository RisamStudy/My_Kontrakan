import axios from 'axios'

// Konfigurasi base URL API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Buat instance axios dengan konfigurasi default
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 detik timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor untuk menambahkan header role
api.interceptors.request.use(
  (config) => {
    // Ambil user role dari localStorage
    try {
      const user = localStorage.getItem('user')
      if (user) {
        const userData = JSON.parse(user)
        if (userData.role && userData.role !== 'guest') {
          config.headers['X-User-Role'] = userData.role
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor untuk menangani error demo user
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.code === 'DEMO_ACCESS_DENIED') {
      // Tampilkan pesan khusus untuk demo user
      alert('⚠️ Akses Ditolak\n\nAkun demo hanya dapat melihat data.\nUntuk mencoba fitur lengkap, silakan login dengan akun admin.')
    }
    return Promise.reject(error)
  }
)

export default api
export { API_BASE_URL }