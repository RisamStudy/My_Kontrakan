import { useState, useEffect } from 'react'
import { UserPlus, Edit, Trash2, Search, Filter, Eye, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { canCreate, canEdit, canDelete, isDemo } from '../lib/auth'
import { db, storage } from '../lib/supabase'

function Penyewa() {
  const [showModal, setShowModal] = useState(false)
  const [penyewaList, setPenyewaList] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Semua Status')
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    email: '',
    telepon: '',
    alamat: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    fetchPenyewa()
  }, [])

  const fetchPenyewa = async () => {
    try {
      const { data, error } = await db.penyewa.getAll()
      if (error) {
        console.error('Error fetching penyewa:', error)
        return
      }
      setPenyewaList(data || [])
    } catch (error) {
      console.error('Error fetching penyewa:', error)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Siapkan data penyewa
      const penyewaData = {
        nama: formData.nama,
        nik: formData.nik || null,
        email: formData.email || null,
        telepon: formData.telepon,
        alamat: formData.alamat || null,
        status_bayar: 'belum_bayar'
      }

      // Upload KTP jika ada
      if (selectedFile) {
        try {
          const fileName = `${Date.now()}-${selectedFile.name}`
          const { data: uploadData, error: uploadError } = await storage.upload('ktp-documents', fileName, selectedFile)
          
          if (uploadError) {
            console.error('Upload error:', uploadError)
            alert('Gagal upload KTP: ' + uploadError.message)
            return
          }
          
          penyewaData.ktp_path = fileName
        } catch (uploadError) {
          console.error('Upload error:', uploadError)
          alert('Gagal upload KTP: ' + uploadError.message)
          return
        }
      }
      
      if (editingId) {
        const { data, error } = await db.penyewa.update(editingId, penyewaData)
        if (error) {
          console.error('Update error:', error)
          alert('Gagal update penyewa: ' + error.message)
          return
        }
        alert('Penyewa berhasil diupdate!')
      } else {
        const { data, error } = await db.penyewa.create(penyewaData)
        if (error) {
          console.error('Create error:', error)
          alert('Gagal menambah penyewa: ' + error.message)
          return
        }
        alert('Penyewa berhasil ditambahkan!')
      }
      
      setShowModal(false)
      setEditingId(null)
      setSelectedFile(null)
      setPreview(null)
      setFormData({ nama: '', nik: '', email: '', telepon: '', alamat: '' })
      fetchPenyewa()
    } catch (error) {
      alert('Gagal menyimpan penyewa: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setFormData({
      nama: item.nama,
      nik: item.nik || '',
      email: item.email,
      telepon: item.telepon,
      alamat: item.alamat || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!canDelete()) {
      alert('Anda tidak memiliki izin untuk menghapus data')
      return
    }
    
    if (!confirm('Yakin ingin menghapus penyewa ini?')) return
    
    try {
      const { error } = await db.penyewa.delete(id)
      if (error) {
        console.error('Delete error:', error)
        alert('Gagal menghapus penyewa: ' + error.message)
        return
      }
      alert('Penyewa berhasil dihapus!')
      fetchPenyewa()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Gagal menghapus penyewa: ' + error.message)
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setSelectedFile(null)
    setPreview(null)
    setFormData({ nama: '', nik: '', email: '', telepon: '', alamat: '' })
    setShowModal(true)
  }

  // Function to get payment status based on amounts (same as in Pembayaran.jsx)
  const getStatusPembayaran = (totalBiaya, uangDibayar) => {
    const total = parseFloat(totalBiaya) || 0
    const dibayar = parseFloat(uangDibayar) || 0
    
    if (total === 0) {
      return { status: 'Belum Ada Kontrak', color: 'text-gray-600', variant: 'outline' }
    } else if (dibayar >= total) {
      return { status: 'Lunas', color: 'text-green-600', variant: 'success' }
    } else if (dibayar > 0) {
      return { status: 'Kurang Bayar', color: 'text-orange-600', variant: 'warning' }
    } else {
      return { status: 'Belum Bayar', color: 'text-red-600', variant: 'destructive' }
    }
  }

  // Function to map database ENUM values to display text
  const getDisplayStatus = (dbStatus, totalBiaya, uangDibayar) => {
    // If we have payment data, calculate the real status
    if (totalBiaya && uangDibayar !== undefined) {
      return getStatusPembayaran(totalBiaya, uangDibayar)
    }
    
    // Otherwise, map the database ENUM values
    const statusMap = {
      'lunas': { status: 'Lunas', color: 'text-green-600', variant: 'success' },
      'hutang': { status: 'Kurang Bayar', color: 'text-orange-600', variant: 'warning' },
      'belum_bayar': { status: 'Belum Bayar', color: 'text-red-600', variant: 'destructive' }
    }
    
    return statusMap[dbStatus] || { status: 'Belum Ada Kontrak', color: 'text-gray-600', variant: 'outline' }
  }

  const filteredPenyewa = penyewaList.filter(item => {
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.nama_properti.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.telepon.includes(searchTerm)
    const matchesStatus = statusFilter === 'Semua Status' || item.status_bayar === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Daftar Penyewa Kontrakan</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Kelola informasi dan status kontrak penyewa Anda.</p>
          {isDemo() && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
              <Eye className="w-4 h-4" />
              Mode Demo - Hanya dapat melihat data
            </div>
          )}
        </div>
        {canCreate() && (
          <Button onClick={openAddModal} className="gap-2 w-full sm:w-auto">
            <UserPlus className="w-4 h-4" />
            Tambah Penyewa
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cari nama penyewa, unit, atau telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="lunas">Lunas</option>
            <option value="hutang">Hutang</option>
            <option value="belum_bayar">Belum Bayar</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Nama Penyewa</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Unit Kontrakan</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">No. Telepon</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Alamat Asal</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Status Pembayaran</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPenyewa.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      {searchTerm || statusFilter !== 'Semua Status' 
                        ? 'Tidak ada penyewa yang sesuai dengan pencarian.'
                        : 'Belum ada penyewa. Klik tombol "Tambah Penyewa" untuk memulai.'
                      }
                    </td>
                  </tr>
                ) : (
                  filteredPenyewa.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-semibold">
                              {item.nama.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{item.nama}</div>
                            <div className="text-sm text-gray-500">{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{item.nama_properti || '-'}</div>
                          <div className="text-gray-500">Tipe Studio</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">{item.telepon}</td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={item.alamat}>
                          {item.alamat || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={getDisplayStatus(item.status_bayar, item.total_biaya, item.uang_dibayar).variant}>
                          {getDisplayStatus(item.status_bayar, item.total_biaya, item.uang_dibayar).status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          {canEdit() && (
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          {canDelete() && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
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

      {/* Pagination Info */}
      {filteredPenyewa.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Menampilkan 1-{filteredPenyewa.length} dari {filteredPenyewa.length} penyewa</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              ‹
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-600 text-white">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              ›
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent onClose={() => setShowModal(false)} className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <DialogTitle className="text-2xl">Formulir Tambah Penyewa</DialogTitle>
                  <p className="text-gray-500 text-sm mt-1">Lengkapi data di bawah ini untuk menambahkan penyewa ke sistem.</p>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 p-6 pt-0">
            {/* Data Pribadi Penyewa */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">👤</span>
                </div>
                <h3 className="text-lg font-semibold">Data Pribadi Penyewa</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nama Lengkap Penyewa</label>
                  <Input
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    placeholder="Masukkan nama sesuai KTP"
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">NIK / No. Identitas (Opsional)</label>
                  <Input
                    value={formData.nik}
                    onChange={(e) => setFormData({...formData, nik: e.target.value})}
                    placeholder="16 digit nomor NIK (opsional)"
                    className="bg-gray-50"
                    maxLength="16"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Alamat Email (Opsional)</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="contoh@email.com (opsional)"
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nomor Telepon (WhatsApp)</label>
                  <Input
                    required
                    value={formData.telepon}
                    onChange={(e) => setFormData({...formData, telepon: e.target.value})}
                    placeholder="+62  81234567890"
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Alamat Asal</label>
                  <textarea
                    required
                    value={formData.alamat}
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                    placeholder="Alamat lengkap sesuai KTP"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    rows="4"
                  />
                </div>
                
              </div>
            </div>

            {/* Dokumen Identitas */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📄</span>
                </div>
                <h3 className="text-lg font-semibold">Dokumen Identitas</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Unggah Foto KTP / Identitas</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      id="ktp-input"
                      className="hidden"
                    />
                    <label htmlFor="ktp-input" className="cursor-pointer">
                      {preview ? (
                        <div className="space-y-2">
                          {selectedFile?.type?.includes('image') ? (
                            <img src={preview} alt="Preview KTP" className="max-h-48 mx-auto rounded-lg" />
                          ) : (
                            <div className="w-16 h-16 bg-blue-100 rounded-lg mx-auto flex items-center justify-center">
                              <span className="text-blue-600 text-2xl">📄</span>
                            </div>
                          )}
                          <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                            <span className="text-gray-400 text-2xl">🖼️</span>
                          </div>
                          <div>
                            <p className="text-blue-600 font-medium">Klik untuk unggah</p>
                            <p className="text-blue-600">atau tarik file ke sini</p>
                            <p className="text-xs text-gray-500 mt-2">PNG, JPG, PDF sampai 5MB</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingId ? 'Update Penyewa' : 'Simpan Penyewa'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Penyewa
