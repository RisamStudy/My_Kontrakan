import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Building2, User, Lock, Eye, EyeOff } from 'lucide-react'
import { db } from '../lib/supabase'

function Login() {
  const [formData, setFormData] = useState({
    nama: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Jika sudah login, redirect ke dashboard
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (isLoggedIn) {
      window.location.href = '/'
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Attempting login with:', formData)
      
      // Mapping nama input ke nama di database
      const nameMapping = {
        'mamah': 'Mamah',
        'admin': 'Admin', 
        'demo': 'Demo User'
      }
      
      const dbName = nameMapping[formData.nama.toLowerCase()] || formData.nama
      console.log('Searching for admin with name:', dbName)
      
      // Cari admin berdasarkan nama yang sudah dimapping
      let { data: admin, error } = await db.admin.getByNama(dbName)
      
      if (error) {
        console.error('Database error:', error)
        setError('Terjadi kesalahan saat login')
        return
      }

      if (!admin) {
        setError('Nama pengguna tidak ditemukan')
        return
      }

      // Untuk sederhananya, kita cek password langsung
      // Di production, sebaiknya gunakan bcrypt atau Supabase Auth
      const validPasswords = {
        'mamah': '123',
        'admin': '321', 
        'demo': 'demo123'
      }

      if (validPasswords[formData.nama] !== formData.password) {
        setError('Password salah')
        return
      }

      // Login berhasil
      const user = {
        nama: admin.nama,
        email: admin.email,
        role: admin.role
      }

      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('isLoggedIn', 'true')
      
      console.log('Login successful:', user)
      
      // Redirect ke dashboard
      window.location.href = '/'
      
    } catch (error) {
      console.error('Login error:', error)
      setError('Terjadi kesalahan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">KontrakanKu</h1>
          </div>
          <p className="text-gray-600">Sistem Manajemen Kontrakan</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">Masuk ke Akun Anda</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Pengguna
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    placeholder="Masukkan nama pengguna"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 space-y-4">
              {/* Demo Account */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800 mb-2">👁️ Akun Demo (Hanya Baca):</p>
                <div className="text-xs text-green-700 space-y-1">
                  <div>👤 <strong>demo</strong> / kata sandi: <strong>demo123</strong></div>
                  <div className="text-xs text-green-600 mt-1">
                    ✓ Dapat melihat semua data<br/>
                    ✗ Tidak dapat menambah/ubah/hapus
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          © 2026 KontrakanKu. Sistem Manajemen Properti.
        </div>
      </div>
    </div>
  )
}

export default Login