import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Edit, Trash2, Building2, Upload, Eye, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { canCreate, canEdit, canDelete, isDemo } from '../lib/auth'
import api from '../lib/api'

function Properti() {
  const [showModal, setShowModal] = useState(false)
  const [propertiList, setPropertiList] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [formData, setFormData] = useState({
    nama_unit: '',
    tipe: '',
    harga_sewa: '',
    status: 'kosong'
  })

  useEffect(() => {
    fetchProperti()
  }, [])

  const fetchProperti = async () => {
    try {
      const response = await api.get('/api/properti')
      setPropertiList(response.data || [])
    } catch (error) {
      console.error('Error fetching properti:', error)
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
      const formDataToSend = new FormData()
      formDataToSend.append('nama_unit', formData.nama_unit)
      formDataToSend.append('tipe', formData.tipe)
      formDataToSend.append('harga_sewa', formData.harga_sewa)
      formDataToSend.append('status', formData.status)
      if (selectedFile) {
        formDataToSend.append('foto', selectedFile)
      }
      
      if (editingId) {
        await api.put(`/api/properti/${editingId}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        alert('Properti berhasil diupdate!')
      } else {
        await api.post('/api/properti', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        alert('Properti berhasil ditambahkan!')
      }
      
      setShowModal(false)
      setEditingId(null)
      setSelectedFile(null)
      setPreview(null)
      setFormData({ nama_unit: '', tipe: '', harga_sewa: '', status: 'kosong' })
      fetchProperti()
    } catch (error) {
      alert('Gagal menyimpan properti: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setFormData({
      nama_unit: item.nama_unit,
      tipe: item.tipe,
      harga_sewa: item.harga_sewa.toString(),
      status: item.status
    })
    if (item.foto_path) {
      setPreview(`http://localhost:8080${item.foto_path}`)
    }
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus properti ini?')) return
    
    try {
      await api.delete(`/api/properti/${id}`)
      alert('Properti berhasil dihapus!')
      fetchProperti()
    } catch (error) {
      alert('Gagal menghapus properti: ' + error.message)
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setSelectedFile(null)
    setPreview(null)
    setFormData({ nama_unit: '', tipe: '', harga_sewa: '', status: 'kosong' })
    setShowModal(true)
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Manajemen Properti</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Kelola semua unit properti kontrakan Anda</p>
          {isDemo() && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
              <Eye className="w-4 h-4" />
              Mode Demo - Hanya dapat melihat data
            </div>
          )}
        </div>
        {canCreate() && (
          <Button onClick={openAddModal} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Tambah Properti
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {propertiList.map(item => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-100">
                {item.foto_path ? (
                  <img 
                    src={`http://localhost:8080${item.foto_path}`} 
                    alt={item.nama_unit}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(item.status)}
                </div>
              </div>
              <CardTitle>{item.nama_unit}</CardTitle>
              <CardDescription>{item.tipe}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Harga Sewa</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rp {parseInt(item.harga_sewa).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500">per bulan</p>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  {canEdit() && (
                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleEdit(item)}>
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                  {canDelete() && (
                    <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {propertiList.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Belum ada properti. Klik tombol "Tambah Properti" untuk memulai.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent onClose={() => setShowModal(false)}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{editingId ? 'Edit Properti' : 'Tambah Properti Baru'}</DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-0">
            <div className="space-y-2">
              <label className="text-sm font-medium">Foto Properti</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="foto-input"
                  className="hidden"
                />
                <label htmlFor="foto-input" className="cursor-pointer">
                  {preview ? (
                    <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  ) : (
                    <div className="py-8">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Klik untuk upload foto</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Unit</label>
              <Input
                required
                value={formData.nama_unit}
                onChange={(e) => setFormData({...formData, nama_unit: e.target.value})}
                placeholder="Contoh: Kamar A1 - Lt 1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe</label>
              <Input
                required
                value={formData.tipe}
                onChange={(e) => setFormData({...formData, tipe: e.target.value})}
                placeholder="Contoh: Studio, 2 Kamar"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Harga Sewa (per bulan)</label>
              <Input
                type="number"
                required
                value={formData.harga_sewa}
                onChange={(e) => setFormData({...formData, harga_sewa: e.target.value})}
                placeholder="1500000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="kosong">Kosong</option>
                <option value="terisi">Terisi</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button type="submit">{editingId ? 'Update' : 'Simpan'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Properti
