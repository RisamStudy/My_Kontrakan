import { useState, useEffect } from 'react'
import axios from 'axios'
import { TrendingUp, Building2, AlertCircle, Edit, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import api from '../lib/api'

function Dashboard() {
  const [stats, setStats] = useState({
    totalPendapatan: 0,
    unitTerisi: 0,
    totalUnit: 0,
    jatuhTempo: 0
  })
  const [propertiList, setPropertiList] = useState([])

  useEffect(() => {
    fetchDashboardData()
    fetchProperti()
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log('=== FETCHING DASHBOARD DATA ===')
      const response = await api.get('/api/dashboard/stats')
      console.log('Dashboard stats received:', response.data)
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const fetchProperti = async () => {
    try {
      const response = await api.get('/api/properti')
      setPropertiList(response.data || [])
    } catch (error) {
      console.error('Error fetching properti:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus properti ini?')) return
    
    try {
      await axios.delete(`/api/properti/${id}`)
      alert('Properti berhasil dihapus!')
      fetchDashboardData()
      fetchProperti()
    } catch (error) {
      alert('Gagal menghapus properti: ' + error.message)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      kosong: 'outline',
      terisi: 'success',
      maintenance: 'warning'
    }
    const labels = {
      kosong: 'Kosong',
      terisi: 'Terisi',
      maintenance: 'Maintenance'
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Manajemen Kontrakan</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Ringkasan performa dan aktivitas properti Anda.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">Rp {stats.totalPendapatan.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalPendapatan > 0 ? (
                <span className="text-green-600 font-medium">Total uang diterima</span>
              ) : (
                <span className="text-gray-500">Belum ada pembayaran</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unit Terisi</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{stats.unitTerisi}/{stats.totalUnit}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalUnit > 0 ? (
                <span className="text-blue-600 font-medium">
                  {Math.round((stats.unitTerisi / stats.totalUnit) * 100)}% tingkat hunian
                </span>
              ) : (
                <span className="text-gray-500">Belum ada properti</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jatuh Tempo (7 Hari)</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{stats.jatuhTempo} Kontrak</div>
            <p className="text-xs mt-1">
              {stats.jatuhTempo > 0 ? (
                <span className="text-orange-600 font-medium">Perlu Tindakan</span>
              ) : (
                <span className="text-green-600 font-medium">Semua aman</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Properti Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Properti Aktif</CardTitle>
          <CardDescription>Kelola dan pantau semua unit properti Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-gray-500">Unit Properti</th>
                  <th className="text-left py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-gray-500 hidden sm:table-cell">Penyewa</th>
                  <th className="text-left py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-gray-500 hidden md:table-cell">Jatuh Tempo</th>
                  <th className="text-left py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-gray-500 hidden lg:table-cell">Harga Sewa</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {propertiList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      Belum ada properti. Klik menu "Properti" untuk menambah properti baru.
                    </td>
                  </tr>
                ) : (
                  propertiList.map(item => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 lg:py-4 px-2 lg:px-4">
                        <div className="flex items-center gap-2 lg:gap-3">
                          {item.foto_path ? (
                            <img src={`http://localhost:8080${item.foto_path}`} alt={item.nama_unit} className="w-8 lg:w-12 h-8 lg:h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 lg:w-12 h-8 lg:h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Building2 className="w-4 lg:w-6 h-4 lg:h-6 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-sm lg:text-base truncate">{item.nama_unit}</span>
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-gray-600 text-sm lg:text-base hidden sm:table-cell">{item.nama_penyewa || '-'}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-gray-600 text-sm lg:text-base hidden md:table-cell">{item.jatuh_tempo || '-'}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 font-medium text-sm lg:text-base hidden lg:table-cell">Rp {parseInt(item.harga_sewa).toLocaleString('id-ID')}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4">
                        <div className="flex gap-1 lg:gap-2">
                          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/properti'}>
                            <Edit className="w-3 lg:w-4 h-3 lg:h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-3 lg:w-4 h-3 lg:h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
