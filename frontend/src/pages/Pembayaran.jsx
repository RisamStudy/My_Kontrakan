import { useState, useEffect } from 'react'
import { 
  Upload, 
  FileText, 
  Calendar, 
  Users, 
  Home, 
  Calculator,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  X,
  ArrowLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { canCreate, canEdit, canDelete, isDemo, getCurrentUser } from '../lib/auth'
import { db, storage } from '../lib/supabase'

// Helper functions untuk Supabase storage URLs
const getStorageUrl = (bucket, path) => {
  if (!path) return null
  return storage.getPublicUrl(bucket, path)
}

const getKwitansiUrl = (path) => getStorageUrl('kwitansi-receipts', path)
const getKtpUrl = (path) => getStorageUrl('ktp-documents', path)

function Pembayaran() {
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [penyewaList, setPenyewaList] = useState([])
  const [propertiList, setPropertiList] = useState([])
  const [pembayaranList, setPembayaranList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentHistory, setPaymentHistory] = useState([])
  
  // Form data untuk kontrak baru
  const [formData, setFormData] = useState({
    penyewa_id: '',
    properti_id: '',
    tanggal_mulai: '',
    tanggal_akhir: '',
    harga_sewa: '',
    durasi_bulan: 12,
    total_biaya: 0,
    uang_dibayar: '',
    metode_bayar: 'Transfer'
  })
  
  // Upload kwitansi
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)

  // Form data untuk tambah pembayaran
  const [addPaymentData, setAddPaymentData] = useState({
    jumlah_tambahan: '',
    metode_bayar: 'Transfer',
    keterangan: ''
  })
  const [addPaymentFile, setAddPaymentFile] = useState(null)
  const [addPaymentPreview, setAddPaymentPreview] = useState(null)

  // Fungsi untuk menghitung statistik berdasarkan data pembayaran
  const calculateStats = () => {
    // Pendapatan berjalan - total uang yang sudah dibayar
    const totalPendapatan = pembayaranList.reduce((total, item) => {
      return total + (item.uang_dibayar || item.nominal || 0)
    }, 0)

    // Kontrak yang akan berakhir dalam 30 hari
    const akanBerakhir = pembayaranList.filter(item => {
      if (!item.tanggal_akhir) return false
      const endDate = new Date(item.tanggal_akhir)
      const now = new Date()
      const diffTime = endDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 && diffDays <= 30
    }).length

    // Kontrak aktif - kontrak yang belum berakhir
    const kontrakAktif = pembayaranList.filter(item => {
      if (!item.tanggal_akhir) return true // Jika tidak ada tanggal akhir, anggap aktif
      const endDate = new Date(item.tanggal_akhir)
      const now = new Date()
      return endDate > now
    }).length

    // Kontrak lunas
    const kontrakLunas = pembayaranList.filter(item => {
      const total = parseFloat(item.nominal) || 0
      const dibayar = parseFloat(item.uang_dibayar || item.nominal) || 0
      return dibayar >= total
    }).length

    return {
      totalPendapatan,
      akanBerakhir,
      kontrakAktif,
      kontrakLunas
    }
  }

  const stats = calculateStats()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    calculateTotal()
  }, [formData.harga_sewa, formData.tanggal_mulai, formData.tanggal_akhir])

  const fetchData = async () => {
    try {
      const [penyewaRes, propertiRes, pembayaranRes] = await Promise.all([
        db.penyewa.getAll(),
        db.properti.getAll(),
        db.pembayaran.getAll()
      ])
      
      if (penyewaRes.error) console.error('Error fetching penyewa:', penyewaRes.error)
      else setPenyewaList(penyewaRes.data || [])
      
      if (propertiRes.error) console.error('Error fetching properti:', propertiRes.error)
      else setPropertiList(propertiRes.data || [])
      
      if (pembayaranRes.error) console.error('Error fetching pembayaran:', pembayaranRes.error)
      else setPembayaranList(pembayaranRes.data || [])
      
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const calculateTotal = () => {
    const harga = parseFloat(formData.harga_sewa) || 0
    let durasi = 0
    
    // Hitung durasi berdasarkan selisih tanggal
    if (formData.tanggal_mulai && formData.tanggal_akhir) {
      const tanggalMulai = new Date(formData.tanggal_mulai)
      const tanggalAkhir = new Date(formData.tanggal_akhir)
      
      if (tanggalAkhir >= tanggalMulai) {
        // Hitung selisih bulan dengan cara yang benar
        let months = (tanggalAkhir.getFullYear() - tanggalMulai.getFullYear()) * 12
        months += tanggalAkhir.getMonth() - tanggalMulai.getMonth()
        
        // Jika tanggal akhir > tanggal mulai, tambah 1 bulan
        // Jika tanggal akhir = tanggal mulai, tidak tambah (sudah genap bulan)
        // Jika tanggal akhir < tanggal mulai, tidak tambah (belum genap bulan)
        if (tanggalAkhir.getDate() > tanggalMulai.getDate()) {
          months += 1
        }
        
        // Jika sama bulan dan sama tahun, minimal 1 bulan
        if (months === 0) {
          months = 1
        }
        
        durasi = Math.max(1, months)
        
        // Debug
        console.log(`${tanggalMulai.getDate()} ${tanggalMulai.toLocaleString('id-ID', {month: 'short'})} ${tanggalMulai.getFullYear()} s/d ${tanggalAkhir.getDate()} ${tanggalAkhir.toLocaleString('id-ID', {month: 'short'})} ${tanggalAkhir.getFullYear()} = ${durasi} bulan`)
      }
    }
    
    const total = harga * durasi
    setFormData(prev => ({ 
      ...prev, 
      durasi_bulan: durasi,
      total_biaya: total 
    }))
  }

  const formatTanggal = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const calculateDurasiFromData = (tanggalMulai, tanggalAkhir) => {
    if (!tanggalMulai || !tanggalAkhir) return 0
    
    const mulai = new Date(tanggalMulai)
    const akhir = new Date(tanggalAkhir)
    
    let months = (akhir.getFullYear() - mulai.getFullYear()) * 12
    months += akhir.getMonth() - mulai.getMonth()
    
    if (akhir.getDate() > mulai.getDate()) {
      months += 1
    }
    
    return Math.max(1, months)
  }

  const calculateSisaWaktu = (tanggalAkhir) => {
    if (!tanggalAkhir) return { 
      percentage: 0, 
      status: 'Belum ditentukan', 
      color: 'text-gray-500',
      daysLeft: 0,
      displayText: 'Belum ditentukan'
    }
    
    const now = new Date()
    const akhir = new Date(tanggalAkhir)
    const diffTime = akhir.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      const expiredDays = Math.abs(diffDays)
      return { 
        percentage: 100, 
        status: 'BERAKHIR', 
        color: 'text-red-600',
        daysLeft: diffDays,
        displayText: `Sudah berakhir ${expiredDays} hari yang lalu`
      }
    } else if (diffDays === 0) {
      return { 
        percentage: 100, 
        status: 'BERAKHIR HARI INI', 
        color: 'text-red-600',
        daysLeft: 0,
        displayText: 'Berakhir hari ini'
      }
    } else if (diffDays <= 7) {
      return { 
        percentage: 90, 
        status: 'SEGERA BERAKHIR', 
        color: 'text-red-600',
        daysLeft: diffDays,
        displayText: `${diffDays} hari lagi`
      }
    } else if (diffDays <= 30) {
      return { 
        percentage: 80, 
        status: 'AKAN BERAKHIR', 
        color: 'text-orange-600',
        daysLeft: diffDays,
        displayText: `${diffDays} hari lagi`
      }
    } else {
      return { 
        percentage: 50, 
        status: 'BERJALAN', 
        color: 'text-blue-600',
        daysLeft: diffDays,
        displayText: `${diffDays} hari lagi`
      }
    }
  }

  const getStatusPembayaran = (totalBiaya, uangDibayar) => {
    const total = parseFloat(totalBiaya) || 0
    const dibayar = parseFloat(uangDibayar) || 0
    
    if (dibayar >= total) {
      return { status: 'Lunas', color: 'text-green-600', variant: 'success' }
    } else if (dibayar > 0) {
      return { status: 'Kurang Bayar', color: 'text-orange-600', variant: 'warning' }
    } else {
      return { status: 'Belum Bayar', color: 'text-red-600', variant: 'destructive' }
    }
  }

  const handlePropertiChange = (propertiId) => {
    const properti = propertiList.find(p => p.id == propertiId)
    if (properti) {
      setFormData(prev => ({
        ...prev,
        properti_id: propertiId,
        harga_sewa: properti.harga_sewa
      }))
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

  const handleSubmitKontrak = async (e) => {
    e.preventDefault()
    try {
      // Siapkan data pembayaran
      const pembayaranData = {
        penyewa_id: parseInt(formData.penyewa_id),
        nominal: parseFloat(formData.total_biaya),
        uang_dibayar: parseFloat(formData.uang_dibayar),
        tanggal_bayar: formData.tanggal_mulai,
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_akhir: formData.tanggal_akhir,
        metode_bayar: formData.metode_bayar || 'Transfer',
        status: 'pending',
        keterangan: `Kontrak sewa dari ${formData.tanggal_mulai} sampai ${formData.tanggal_akhir}`
      }

      // Upload kwitansi jika ada
      if (selectedFile) {
        try {
          const fileName = `${Date.now()}-${selectedFile.name}`
          const { data: uploadData, error: uploadError } = await storage.upload('kwitansi-receipts', fileName, selectedFile)
          
          if (uploadError) {
            console.error('Upload error:', uploadError)
            alert('Gagal upload kwitansi: ' + uploadError.message)
            return
          }
          
          pembayaranData.kwitansi_path = fileName
        } catch (uploadError) {
          console.error('Upload error:', uploadError)
          alert('Gagal upload kwitansi: ' + uploadError.message)
          return
        }
      }

      // Debug log
      console.log('=== FORM SUBMISSION DEBUG ===')
      console.log('EditingId:', editingId)
      console.log('PembayaranData:', pembayaranData)
      console.log('SelectedFile:', selectedFile?.name)

      if (editingId) {
        const { data, error } = await db.pembayaran.update(editingId, pembayaranData)
        if (error) {
          console.error('Update error:', error)
          alert('Gagal update pembayaran: ' + error.message)
          return
        }
        alert('Kontrak berhasil diupdate!')
      } else {
        const { data, error } = await db.pembayaran.create(pembayaranData)
        if (error) {
          console.error('Create error:', error)
          alert('Gagal membuat pembayaran: ' + error.message)
          return
        }
        alert('Kontrak berhasil dibuat!')
      }
      
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Submit error:', error)
      alert('Gagal menyimpan kontrak: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      penyewa_id: '',
      properti_id: '',
      tanggal_mulai: '',
      tanggal_akhir: '',
      harga_sewa: '',
      durasi_bulan: 12,
      total_biaya: 0,
      uang_dibayar: '',
      metode_bayar: 'Transfer'
    })
    setSelectedFile(null)
    setPreview(null)
    setEditingId(null)
  }

  const handleAddPayment = (item) => {
    setSelectedPayment(item)
    setAddPaymentData({
      jumlah_tambahan: '',
      metode_bayar: 'Transfer',
      keterangan: ''
    })
    setAddPaymentFile(null)
    setAddPaymentPreview(null)
    setShowAddPaymentModal(true)
  }

  const handleAddPaymentFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAddPaymentFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAddPaymentPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitAddPayment = async (e) => {
    e.preventDefault()
    
    if (!addPaymentData.jumlah_tambahan || parseFloat(addPaymentData.jumlah_tambahan) <= 0) {
      alert('Jumlah tambahan harus lebih dari 0')
      return
    }

    try {
      console.log('=== TAMBAH RIWAYAT PEMBAYARAN ===')
      console.log('Pembayaran ID:', selectedPayment.id)
      console.log('Jumlah Tambahan:', addPaymentData.jumlah_tambahan)

      // Upload kwitansi jika ada
      let kwitansiPath = null
      if (addPaymentFile) {
        try {
          const fileName = `${Date.now()}-${addPaymentFile.name}`
          const { data: uploadData, error: uploadError } = await storage.upload('kwitansi-receipts', fileName, addPaymentFile)
          
          if (uploadError) {
            console.error('Upload error:', uploadError)
            alert('Gagal upload kwitansi: ' + uploadError.message)
            return
          }
          
          kwitansiPath = fileName
        } catch (uploadError) {
          console.error('Upload error:', uploadError)
          alert('Gagal upload kwitansi: ' + uploadError.message)
          return
        }
      }

      // Data untuk riwayat pembayaran baru
      const riwayatData = {
        pembayaran_id: selectedPayment.id,
        jumlah_dibayar: parseFloat(addPaymentData.jumlah_tambahan),
        metode_bayar: addPaymentData.metode_bayar,
        keterangan: addPaymentData.keterangan || `Pembayaran tambahan Rp ${parseFloat(addPaymentData.jumlah_tambahan).toLocaleString('id-ID')}`,
        tanggal_bayar: new Date().toISOString(),
        kwitansi_path: kwitansiPath
      }

      // Tambah riwayat pembayaran baru
      const { data: riwayatResult, error: riwayatError } = await db.pembayaran.addRiwayat(riwayatData)
      if (riwayatError) {
        console.error('Riwayat error:', riwayatError)
        alert('Gagal menambah riwayat pembayaran: ' + riwayatError.message)
        return
      }

      // Update total uang_dibayar di tabel pembayaran utama
      const currentPaid = parseFloat(selectedPayment.uang_dibayar || selectedPayment.nominal || 0)
      const additionalAmount = parseFloat(addPaymentData.jumlah_tambahan)
      const newTotalPaid = currentPaid + additionalAmount
      
      const updateData = {
        uang_dibayar: newTotalPaid,
        metode_bayar: addPaymentData.metode_bayar
      }

      const { data: updateResult, error: updateError } = await db.pembayaran.update(selectedPayment.id, updateData)
      if (updateError) {
        console.error('Update error:', updateError)
        alert('Gagal update pembayaran: ' + updateError.message)
        return
      }
      
      alert(`Berhasil menambah pembayaran Rp ${additionalAmount.toLocaleString('id-ID')}!\nTotal dibayar sekarang: Rp ${newTotalPaid.toLocaleString('id-ID')}`)
      setShowAddPaymentModal(false)
      
      // Refresh payment history after adding new payment
      try {
        const { data: historyData, error: historyError } = await db.pembayaran.getRiwayat(selectedPayment.id)
        if (historyError) {
          console.error('Error refreshing payment history:', historyError)
        } else {
          setPaymentHistory(historyData || [])
        }
      } catch (error) {
        console.error('Error refreshing payment history:', error)
      }
      
      fetchData()
    } catch (error) {
      console.error('Add payment error:', error)
      alert('Gagal menambah pembayaran: ' + error.message)
    }
  }

  const handleEdit = (item) => {
    console.log('=== EDIT PEMBAYARAN ===')
    console.log('Item data:', item)
    
    setEditingId(item.id)
    
    // Konversi tanggal dari format database ke format input date (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().split('T')[0] // Mengambil bagian YYYY-MM-DD saja
    }
    
    setFormData({
      penyewa_id: item.penyewa_id || '',
      properti_id: item.properti_id && item.properti_id > 0 ? item.properti_id.toString() : '',
      tanggal_mulai: formatDateForInput(item.tanggal_mulai || item.tanggal_bayar),
      tanggal_akhir: formatDateForInput(item.tanggal_akhir),
      harga_sewa: item.nominal || '',
      durasi_bulan: 12,
      total_biaya: item.nominal || 0,
      uang_dibayar: item.uang_dibayar || item.nominal || '',
      metode_bayar: item.metode_bayar || 'Transfer'
    })
    
    // Set preview gambar kwitansi jika ada
    if (item.kwitansi_path) {
      const kwitansiUrl = getKwitansiUrl(item.kwitansi_path)
      setPreview(kwitansiUrl)
      // Buat object file dummy untuk preview
      setSelectedFile({
        name: 'kwitansi_existing.jpg',
        type: 'image/jpeg',
        size: 0
      })
    } else {
      setPreview(null)
      setSelectedFile(null)
    }
    
    console.log('Form data set:', {
      penyewa_id: item.penyewa_id,
      properti_id: item.properti_id,
      properti_id_converted: item.properti_id && item.properti_id > 0 ? item.properti_id.toString() : '',
      tanggal_mulai: formatDateForInput(item.tanggal_mulai || item.tanggal_bayar),
      tanggal_akhir: formatDateForInput(item.tanggal_akhir),
      harga_sewa: item.nominal,
      uang_dibayar: item.uang_dibayar || item.nominal,
      metode_bayar: item.metode_bayar
    })
    
    setShowModal(true)
  }

  const handleViewDetail = async (item) => {
    console.log('=== DEBUG PAYMENT DETAIL ===')
    console.log('Selected Payment Data:', item)
    console.log('NIK:', item.penyewa?.nik)
    console.log('Email:', item.penyewa?.email)
    console.log('Telepon:', item.penyewa?.telepon)
    console.log('Alamat:', item.penyewa?.alamat)
    console.log('KTP Path:', item.penyewa?.ktp_path)
    console.log('=== END DEBUG ===')
    
    // Flatten penyewa data for easier access in the modal
    const flattenedItem = {
      ...item,
      nama_penyewa: item.penyewa?.nama || item.nama_penyewa,
      nik: item.penyewa?.nik || item.nik,
      email: item.penyewa?.email || item.email,
      telepon: item.penyewa?.telepon || item.telepon,
      alamat: item.penyewa?.alamat || item.alamat,
      ktp_path: item.penyewa?.ktp_path || item.ktp_path
    }
    
    setSelectedPayment(flattenedItem)
    
    // Fetch payment history
    try {
      const { data: historyData, error: historyError } = await db.pembayaran.getRiwayat(item.id)
      if (historyError) {
        console.error('Error fetching payment history:', historyError)
        setPaymentHistory([])
      } else {
        setPaymentHistory(historyData || [])
        console.log('Payment history loaded:', historyData)
      }
    } catch (error) {
      console.error('Error fetching payment history:', error)
      setPaymentHistory([])
    }
    
    setShowDetailModal(true)
  }

  const handleImageClick = (imageSrc, title) => {
    setSelectedImage({ src: imageSrc, title })
    setShowImageModal(true)
  }

  const handleShare = async () => {
    const shareData = {
      title: `Detail Pembayaran - ${selectedPayment.nama_penyewa}`,
      text: `Detail pembayaran sewa untuk ${selectedPayment.nama_penyewa}\nNominal: Rp ${selectedPayment.nominal?.toLocaleString('id-ID')}\nStatus: ${getStatusPembayaran(selectedPayment.nominal, selectedPayment.uang_dibayar).status}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback untuk browser yang tidak support Web Share API
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
        alert('Link detail pembayaran telah disalin ke clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback manual copy
      const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`
      try {
        await navigator.clipboard.writeText(textToCopy)
        alert('Detail pembayaran telah disalin ke clipboard!')
      } catch (clipboardError) {
        alert('Tidak dapat membagikan atau menyalin. Silakan salin manual.')
      }
    }
  }

  const handlePrintPDF = () => {
    // Buat konten untuk print
    const printContent = `
      <html>
        <head>
          <title>Kwitansi Pembayaran - ${selectedPayment.nama_penyewa}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .content { margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; }
            .payment-summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .payment-history { margin: 30px 0; }
            .payment-history h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .history-item { background: #f9f9f9; padding: 12px; margin: 8px 0; border-left: 4px solid #007bff; border-radius: 3px; }
            .history-item .payment-number { font-weight: bold; color: #007bff; margin-bottom: 5px; }
            .history-item .payment-amount { font-size: 18px; font-weight: bold; color: #28a745; }
            .history-item .payment-details { font-size: 12px; color: #666; margin-top: 5px; }
            .history-summary { background: #e8f5e8; padding: 10px; border-radius: 5px; margin-top: 15px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KWITANSI PEMBAYARAN SEWA</h1>
            <p>ID Transaksi: ${generateTransactionId(selectedPayment)}</p>
            <p>Tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          
          <div class="content">
            <h3>Data Penyewa</h3>
            <div class="row"><span class="label">Nama Lengkap:</span> <span>${selectedPayment.nama_penyewa || 'Tidak tersedia'}</span></div>
            <div class="row"><span class="label">NIK:</span> <span>${selectedPayment.nik || 'Tidak tersedia'}</span></div>
            <div class="row"><span class="label">Email:</span> <span>${selectedPayment.email || 'Tidak tersedia'}</span></div>
            <div class="row"><span class="label">Telepon:</span> <span>${selectedPayment.telepon || 'Tidak tersedia'}</span></div>
            <div class="row"><span class="label">Alamat:</span> <span>${selectedPayment.alamat || 'Tidak tersedia'}</span></div>
            
            <h3>Detail Pembayaran</h3>
            <div class="row"><span class="label">Unit Properti:</span> <span>Studio Apartment #${selectedPayment.id}</span></div>
            <div class="row"><span class="label">Periode Sewa:</span> <span>${formatTanggal(selectedPayment.tanggal_mulai || selectedPayment.tanggal_bayar)} - ${selectedPayment.tanggal_akhir ? formatTanggal(selectedPayment.tanggal_akhir) : 'Belum ditentukan'}</span></div>
            <div class="row"><span class="label">Durasi:</span> <span>${calculateDurasiFromData(selectedPayment.tanggal_mulai || selectedPayment.tanggal_bayar, selectedPayment.tanggal_akhir)} Bulan</span></div>
            <div class="row"><span class="label">Metode Pembayaran:</span> <span>${selectedPayment.metode_bayar || 'Transfer'}</span></div>
            
            <div class="payment-summary">
              <div class="row"><span class="label">Uang yang Harus Dibayarkan:</span> <span>Rp ${selectedPayment.nominal?.toLocaleString('id-ID') || '0'}</span></div>
              <div class="row"><span class="label">Jumlah Uang yang Dibayar:</span> <span>Rp ${(selectedPayment.uang_dibayar || selectedPayment.nominal || 0).toLocaleString('id-ID')}</span></div>
              <div class="row"><span class="label">Sisa:</span> <span>Rp ${Math.max(0, (selectedPayment.nominal || 0) - (selectedPayment.uang_dibayar || selectedPayment.nominal || 0)).toLocaleString('id-ID')}</span></div>
              <div class="row"><span class="label">Status:</span> <span>${getStatusPembayaran(selectedPayment.nominal, selectedPayment.uang_dibayar).status}</span></div>
            </div>

            ${paymentHistory.length > 0 ? `
            <div class="payment-history">
              <h3>📋 Rincian Pembayaran</h3>
              ${paymentHistory.map((history, index) => `
                <div class="history-item">
                  <div class="payment-number">Pembayaran #${index + 1}</div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div class="payment-amount">Rp ${history.jumlah_dibayar?.toLocaleString('id-ID') || '0'}</div>
                      <div class="payment-details">
                        📅 ${new Date(history.tanggal_bayar).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })} | 💳 ${history.metode_bayar || 'Transfer'}
                        ${history.keterangan ? `<br>📝 ${history.keterangan}` : ''}
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 12px; color: #666;">Total s/d sini:</div>
                      <div style="font-weight: bold; color: #007bff;">Rp ${history.total_sampai_sini?.toLocaleString('id-ID') || '0'}</div>
                    </div>
                  </div>
                </div>
              `).join('')}
              
              <div class="history-summary">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: bold;">Total ${paymentHistory.length} Pembayaran:</span>
                  <span style="font-size: 18px; font-weight: bold; color: #28a745;">
                    Rp ${paymentHistory.reduce((total, history) => total + (history.jumlah_dibayar || 0), 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
            ` : `
            <div class="payment-history">
              <h3>📋 Rincian Pembayaran</h3>
              <div style="text-align: center; padding: 20px; color: #666;">
                <p>Belum ada riwayat pembayaran detail</p>
                <p style="font-size: 12px;">Riwayat akan muncul setelah pembayaran pertama dicatat</p>
              </div>
            </div>
            `}
          </div>
          
          <div class="footer">
            <p>Kwitansi ini dicetak secara otomatis dari sistem KontrakanKu</p>
            <p>Tanggal cetak: ${new Date().toLocaleString('id-ID')}</p>
            ${paymentHistory.length > 0 ? `<p>Rincian pembayaran berdasarkan ${paymentHistory.length} transaksi yang tercatat</p>` : ''}
          </div>
        </body>
      </html>
    `

    // Buka window baru untuk print
    const printWindow = window.open('', '_blank')
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Tunggu sebentar lalu print
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const generateTransactionId = (item) => {
    return `#TRX-${new Date(item.tanggal_bayar).getFullYear()}${String(item.id).padStart(3, '0')}-001`
  }

  const handleDelete = async (id) => {
    if (isDemo()) {
      alert('⚠️ Akses Ditolak\n\nAkun demo hanya dapat melihat data.\nUntuk mencoba fitur lengkap, silakan login dengan akun admin.')
      return
    }
    
    if (!confirm('Yakin ingin menghapus pembayaran ini?')) return
    
    try {
      const { error } = await db.pembayaran.delete(id)
      if (error) {
        console.error('Delete error:', error)
        alert('Gagal menghapus pembayaran: ' + error.message)
        return
      }
      
      alert('Pembayaran berhasil dihapus!')
      fetchData()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Gagal menghapus pembayaran: ' + error.message)
    }
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const getStatusBadge = (status) => {
    const variants = {
      lunas: 'success',
      pending: 'warning',
      ditolak: 'destructive'
    }
    const labels = {
      lunas: 'Lunas',
      pending: 'Pending',
      ditolak: 'Ditolak'
    }
    return <Badge variant={variants[status] || 'warning'}>{labels[status] || 'Pending'}</Badge>
  }

  const filteredPembayaran = pembayaranList.filter(item => 
    item.penyewa?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.metode_bayar?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Daftar Durasi & Biaya Sewa</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Kelola kontrak sewa dan pembayaran penyewa.</p>
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
            Buat Kontrak Baru
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendapatan Berjalan</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {stats.totalPendapatan.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-green-600">
                  {pembayaranList.length > 0 ? `${pembayaranList.length} transaksi` : 'Belum ada transaksi'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Akan Berakhir (30 Hari)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.akanBerakhir}</p>
                <p className="text-xs text-orange-600">Segera Perpanjang</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kontrak Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{stats.kontrakAktif}</p>
                <p className="text-xs text-green-600">
                  {stats.kontrakLunas} kontrak lunas
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cari penyewa atau unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button className="gap-2 flex-1 sm:flex-none">
            Ekspor
          </Button>
        </div>
      </div>

      {/* Riwayat Kontrak Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kontrak Terkini</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 lg:py-4 px-2 lg:px-6 text-xs lg:text-sm font-medium text-gray-500 uppercase">Nama Penyewa</th>
                  <th className="text-left py-3 lg:py-4 px-2 lg:px-6 text-xs lg:text-sm font-medium text-gray-500 uppercase hidden sm:table-cell">Unit</th>
                  <th className="text-left py-3 lg:py-4 px-2 lg:px-6 text-xs lg:text-sm font-medium text-gray-500 uppercase hidden md:table-cell">Periode Sewa</th>
                  <th className="text-left py-3 lg:py-4 px-2 lg:px-6 text-xs lg:text-sm font-medium text-gray-500 uppercase hidden lg:table-cell">Durasi</th>
                  <th className="text-left py-3 lg:py-4 px-2 lg:px-6 text-xs lg:text-sm font-medium text-gray-500 uppercase hidden xl:table-cell">Sisa Waktu</th>
                  <th className="text-left py-3 lg:py-4 px-2 lg:px-6 text-xs lg:text-sm font-medium text-gray-500 uppercase">Total Bayar</th>
                  <th className="text-left py-3 lg:py-4 px-2 lg:px-6 text-xs lg:text-sm font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPembayaran.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-500">
                      Belum ada data pembayaran. Klik "Buat Kontrak Baru" untuk memulai.
                    </td>
                  </tr>
                ) : (
                  filteredPembayaran.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 lg:py-4 px-2 lg:px-6">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <div className="w-6 lg:w-8 h-6 lg:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-xs lg:text-sm font-semibold">
                              {item.penyewa?.nama?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm lg:text-base truncate">{item.penyewa?.nama || 'Unknown'}</div>
                            <div className="text-xs text-gray-500 sm:hidden">Unit #{item.id}</div>
                            <div className="text-xs text-gray-500 md:hidden">
                              {item.tanggal_mulai ? formatTanggal(item.tanggal_mulai) : formatTanggal(item.tanggal_bayar)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-6 hidden sm:table-cell">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">Unit #{item.id}</div>
                          <div className="text-gray-500">Studio</div>
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-6 hidden md:table-cell">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {item.tanggal_mulai ? formatTanggal(item.tanggal_mulai) : formatTanggal(item.tanggal_bayar)}
                          </div>
                          <div className="text-gray-500">
                            s/d {item.tanggal_akhir ? formatTanggal(item.tanggal_akhir) : 'Belum ditentukan'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-6 hidden lg:table-cell">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          {calculateDurasiFromData(item.tanggal_mulai || item.tanggal_bayar, item.tanggal_akhir)} Bulan
                        </Badge>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-6 hidden xl:table-cell">
                        {(() => {
                          const sisaWaktu = calculateSisaWaktu(item.tanggal_akhir)
                          return (
                            <div className="text-sm">
                              <div className={`font-medium ${sisaWaktu.color}`}>{sisaWaktu.status}</div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  className={`h-2 rounded-full ${
                                    sisaWaktu.daysLeft < 0 ? 'bg-red-600' :
                                    sisaWaktu.daysLeft <= 7 ? 'bg-red-500' :
                                    sisaWaktu.daysLeft <= 30 ? 'bg-orange-500' : 'bg-blue-600'
                                  }`}
                                  style={{width: `${sisaWaktu.percentage}%`}}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{sisaWaktu.displayText}</div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-6">
                        <div className="text-sm">
                          <div className="font-bold text-gray-900 text-sm lg:text-base">Rp {item.nominal?.toLocaleString('id-ID') || '0'}</div>
                          <div className="text-green-600 text-xs">
                            <Badge variant={getStatusPembayaran(item.nominal, item.uang_dibayar).variant} className="text-xs">
                              {getStatusPembayaran(item.nominal, item.uang_dibayar).status}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-6">
                        <div className="flex gap-1 lg:gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(item)}>
                            <Eye className="w-3 lg:w-4 h-3 lg:h-4 text-blue-600" />
                          </Button>
                          {canEdit() && (
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                              <Edit className="w-3 lg:w-4 h-3 lg:h-4 text-green-600" />
                            </Button>
                          )}
                          {canEdit() && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleAddPayment(item)}
                              title="Tambah Pembayaran"
                            >
                              <Plus className="w-3 lg:w-4 h-3 lg:h-4 text-orange-600" />
                            </Button>
                          )}
                          {canDelete() && (
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-3 lg:w-4 h-3 lg:h-4 text-red-600" />
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

      {/* Pagination */}
      {filteredPembayaran.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Menampilkan 1-{filteredPembayaran.length} dari {filteredPembayaran.length} kontrak</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>‹</Button>
            <Button variant="outline" size="sm" className="bg-blue-600 text-white">1</Button>
            <Button variant="outline" size="sm" disabled>›</Button>
          </div>
        </div>
      )}

      {/* Modal untuk Buat/Edit Kontrak */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent onClose={() => setShowModal(false)} className="max-w-6xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl lg:text-2xl">
                  {editingId ? 'Edit Kontrak' : 'Formulir Kontrak & Kalkulator Biaya'}
                </DialogTitle>
                <p className="text-gray-500 text-sm mt-1">
                  {editingId 
                    ? 'Ubah detail kontrak pembayaran. Data yang sudah ada akan tetap tersimpan jika tidak diubah.'
                    : 'Lengkapi detail durasi untuk menghitung total biaya sewa secara otomatis.'
                  }
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSubmitKontrak} className="space-y-4 lg:space-y-6 p-4 lg:p-6 pt-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Form Kontrak */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <CardTitle>Pilih Penyewa & Unit</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Penyewa *</label>
                      <select
                        value={formData.penyewa_id}
                        onChange={(e) => setFormData({...formData, penyewa_id: e.target.value})}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        required
                      >
                        <option value="">Pilih nama penyewa</option>
                        {penyewaList.map(penyewa => (
                          <option key={penyewa.id} value={penyewa.id}>
                            {penyewa.nama} - {penyewa.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Unit Kontrakan *</label>
                      <div className="flex gap-2">
                        <select
                          value={formData.properti_id}
                          onChange={(e) => handlePropertiChange(e.target.value)}
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                          required
                        >
                          <option value="">Pilih nomor/nama unit</option>
                          {propertiList.filter(p => 
                            p.status === 'kosong' || 
                            (editingId && p.id == parseInt(formData.properti_id))
                          ).map(properti => (
                            <option key={properti.id} value={properti.id}>
                              {properti.nama_unit} - {properti.tipe} (Rp {properti.harga_sewa?.toLocaleString('id-ID')})
                              {properti.status === 'terisi' && editingId && properti.id == parseInt(formData.properti_id) ? ' - Saat ini dipilih' : ''}
                            </option>
                          ))}
                        </select>
                        <Button type="button" variant="outline" size="icon">
                          <Home className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <CardTitle>Durasi Sewa & Tarif</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai *</label>
                        <Input
                          type="date"
                          value={formData.tanggal_mulai}
                          onChange={(e) => setFormData({...formData, tanggal_mulai: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Akhir *</label>
                        <Input
                          type="date"
                          value={formData.tanggal_akhir}
                          onChange={(e) => setFormData({...formData, tanggal_akhir: e.target.value})}
                          min={formData.tanggal_mulai} // Tanggal akhir tidak boleh lebih kecil dari tanggal mulai
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Harga Sewa Per Bulan *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                        <Input
                          type="number"
                          value={formData.harga_sewa}
                          onChange={(e) => setFormData({...formData, harga_sewa: e.target.value})}
                          className="pl-10"
                          placeholder="1000000"
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Kalkulator & Upload */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <CardTitle>Kalkulasi & Bukti Bayar</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Total Biaya (Otomatis)</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        Rp {formData.total_biaya.toLocaleString('id-ID')}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {formData.tanggal_mulai && formData.tanggal_akhir ? (
                          <>
                            Durasi: {formatTanggal(formData.tanggal_mulai)} s/d {formatTanggal(formData.tanggal_akhir)} = {formData.durasi_bulan} Bulan<br/>
                            Ringkasan: {formData.durasi_bulan} Bulan x Rp {parseFloat(formData.harga_sewa || 0).toLocaleString('id-ID')} = Rp {formData.total_biaya.toLocaleString('id-ID')}
                          </>
                        ) : (
                          'Pilih tanggal mulai dan akhir untuk menghitung total biaya'
                        )}
                      </div>
                      
                      {/* Status Pembayaran */}
                      {formData.uang_dibayar && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Uang Dibayar:</span>
                            <span className="font-medium">Rp {parseFloat(formData.uang_dibayar || 0).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-gray-700">Status:</span>
                            <span className={`text-sm font-medium ${getStatusPembayaran(formData.total_biaya, formData.uang_dibayar).color}`}>
                              {getStatusPembayaran(formData.total_biaya, formData.uang_dibayar).status}
                            </span>
                          </div>
                          {parseFloat(formData.uang_dibayar) < parseFloat(formData.total_biaya) && (
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm text-gray-700">Sisa:</span>
                              <span className="text-sm font-medium text-red-600">
                                Rp {(parseFloat(formData.total_biaya) - parseFloat(formData.uang_dibayar || 0)).toLocaleString('id-ID')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Uang yang Dibayar *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                        <Input
                          type="number"
                          value={formData.uang_dibayar}
                          onChange={(e) => setFormData({...formData, uang_dibayar: e.target.value})}
                          className="pl-10"
                          placeholder="Masukkan jumlah yang dibayar"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Jumlah uang yang benar-benar dibayarkan oleh penyewa
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Transfer', 'Tunai', 'E-Wallet'].map(metode => (
                          <button
                            key={metode}
                            type="button"
                            onClick={() => setFormData({...formData, metode_bayar: metode})}
                            className={`p-3 rounded-lg border text-sm font-medium ${
                              formData.metode_bayar === metode
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {metode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unggah Bukti Pembayaran</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          id="kwitansi-input"
                          className="hidden"
                        />
                        <label htmlFor="kwitansi-input" className="cursor-pointer">
                          {preview ? (
                            <div className="space-y-2">
                              {selectedFile?.type?.includes('image') || preview.includes('http') ? (
                                <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded" />
                              ) : (
                                <FileText className="w-12 h-12 mx-auto text-blue-600" />
                              )}
                              <p className="text-sm text-gray-600">
                                {selectedFile?.name || (editingId ? 'Bukti pembayaran saat ini' : 'File terpilih')}
                              </p>
                              {editingId && preview.includes('http') && (
                                <p className="text-xs text-blue-600">Klik untuk mengganti dengan file baru</p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-12 h-12 mx-auto text-gray-400" />
                              <div>
                                <p className="text-blue-600 font-medium">Klik atau seret kwitansi ke sini</p>
                                <p className="text-xs text-gray-500">PNG, JPG atau PDF (Maks. 5MB)</p>
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingId ? 'Update Kontrak' : 'Aktivasi Kontrak Sekarang'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Detail Pembayaran */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent onClose={() => setShowDetailModal(false)} className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
          {selectedPayment && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setShowDetailModal(false)}>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="min-w-0">
                      <DialogTitle className="text-xl lg:text-2xl">Detail Bukti Pembayaran</DialogTitle>
                      <p className="text-gray-500 text-sm mt-1 truncate">
                        ID Transaksi: {generateTransactionId(selectedPayment)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 hidden sm:flex" onClick={handleShare}>
                      📤 <span className="hidden lg:inline">Bagikan</span>
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={handlePrintPDF}>
                      📄 <span className="hidden lg:inline">Cetak PDF</span>
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-4 lg:p-6 pt-0">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                  {/* Kwitansi Digital */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">Kwitansi Digital</h3>
                            <p className="text-sm text-green-600 font-medium">PEMBAYARAN BERHASIL</p>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-sm text-gray-500">UANG YANG HARUS DIBAYARKAN</p>
                            <p className="text-2xl font-bold text-blue-600">
                              Rp {selectedPayment.nominal?.toLocaleString('id-ID') || '0'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Nama Penyewa</p>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-sm font-semibold">
                                  {selectedPayment.nama_penyewa?.substring(0, 2) || 'BS'}
                                </span>
                              </div>
                              <span className="font-medium">{selectedPayment.nama_penyewa || 'Unknown'}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-1">Periode Sewa</p>
                            <p className="font-medium">
                              {formatTanggal(selectedPayment.tanggal_mulai || selectedPayment.tanggal_bayar)} - {' '}
                              {selectedPayment.tanggal_akhir ? formatTanggal(selectedPayment.tanggal_akhir) : 'Belum ditentukan'}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-1">Unit Properti</p>
                            <p className="font-medium">Studio Apartment #{selectedPayment.id}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-1">Durasi Kontrak</p>
                            <p className="font-medium text-blue-600">
                              {calculateDurasiFromData(
                                selectedPayment.tanggal_mulai || selectedPayment.tanggal_bayar, 
                                selectedPayment.tanggal_akhir
                              )} Bulan (Tahunan)
                            </p>
                          </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Jumlah Uang yang Dibayar</p>
                              <p className="text-lg font-bold text-blue-600">
                                Rp {(selectedPayment.uang_dibayar || selectedPayment.nominal || 0).toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Sisa</p>
                              <p className="text-lg font-bold text-orange-600">
                                Rp {Math.max(0, (selectedPayment.nominal || 0) - (selectedPayment.uang_dibayar || selectedPayment.nominal || 0)).toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-1">Status</p>
                              <p className={`text-lg font-bold ${
                                (selectedPayment.uang_dibayar || selectedPayment.nominal || 0) >= (selectedPayment.nominal || 0) 
                                  ? 'text-green-600' 
                                  : 'text-orange-600'
                              }`}>
                                {(selectedPayment.uang_dibayar || selectedPayment.nominal || 0) >= (selectedPayment.nominal || 0) ? 'LUNAS' : 'KURANG BAYAR'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bukti Bayar / Transfer */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">💳 Bukti Bayar / Transfer</h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600"
                            onClick={() => selectedPayment.kwitansi_path && handleImageClick(getKwitansiUrl(selectedPayment.kwitansi_path), 'Bukti Transfer/Pembayaran')}
                            disabled={!selectedPayment.kwitansi_path}
                          >
                            🔗 Lihat Ukuran Penuh
                          </Button>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          {selectedPayment.kwitansi_path ? (
                            <div className="space-y-3">
                              <img 
                                src={getKwitansiUrl(selectedPayment.kwitansi_path)}
                                alt="Bukti Transfer" 
                                className="max-w-full max-h-96 mx-auto rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => handleImageClick(getKwitansiUrl(selectedPayment.kwitansi_path), 'Bukti Transfer/Pembayaran')}
                                onError={(e) => {
                                  console.log('Image load error:', e.target.src)
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'block'
                                }}
                              />
                              <p className="text-xs text-gray-500">Klik gambar untuk memperbesar</p>
                            </div>
                          ) : null}
                          <div className="space-y-3" style={{display: selectedPayment.kwitansi_path ? 'none' : 'block'}}>
                            <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                              <FileText className="w-12 h-12 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">Tidak ada bukti transfer</p>
                              <p className="text-gray-500 text-sm">Bukti pembayaran belum diupload</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Informasi Input */}
                  <div className="space-y-6">
                    {/* Data Penyewa */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold">Data Penyewa</h3>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Nama Lengkap</p>
                            <p className="font-medium">{selectedPayment.nama_penyewa || 'Tidak tersedia'}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-1">NIK</p>
                            <p className="font-medium">{selectedPayment.nik || 'Tidak tersedia'}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-1">Alamat Email</p>
                            <p className="font-medium text-blue-600">{selectedPayment.email || 'Tidak tersedia'}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-1">Nomor Telepon (WA)</p>
                            <p className="font-medium">{selectedPayment.telepon || 'Tidak tersedia'}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-1">Alamat Asal</p>
                            <p className="font-medium">{selectedPayment.alamat || 'Tidak tersedia'}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-1">Dokumen Identitas</p>
                            {selectedPayment.ktp_path ? (
                              <div className="flex items-center gap-2">
                                <img 
                                  src={getKtpUrl(selectedPayment.ktp_path)}
                                  alt="KTP" 
                                  className="w-16 h-10 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleImageClick(getKtpUrl(selectedPayment.ktp_path), 'Dokumen Identitas (KTP)')}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'inline'
                                  }}
                                />
                                <span className="text-sm text-gray-500" style={{display: 'none'}}>
                                  📄 KTP tersedia
                                </span>
                                <div>
                                  <span className="text-sm text-green-600 font-medium">KTP telah diupload</span>
                                  <p className="text-xs text-gray-500">Klik gambar untuk memperbesar</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Belum diupload</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Riwayat Pembayaran */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-xs">💰</span>
                          </div>
                          <h3 className="font-semibold">Rincian Pembayaran</h3>
                        </div>

                        <div className="space-y-3">
                          {paymentHistory.length > 0 ? (
                            paymentHistory.map((history, index) => (
                              <div key={history.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-blue-900">
                                    Pembayaran #{index + 1}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {new Date(history.tanggal_bayar).toLocaleDateString('id-ID', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-lg font-bold text-green-600">
                                      Rp {history.jumlah_dibayar?.toLocaleString('id-ID') || '0'}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      via {history.metode_bayar || 'Transfer'}
                                    </p>
                                    {history.keterangan && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {history.keterangan}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-600">Total s/d sini:</p>
                                    <p className="text-sm font-semibold text-blue-600">
                                      Rp {history.total_sampai_sini?.toLocaleString('id-ID') || '0'}
                                    </p>
                                    {history.kwitansi_path && (
                                      <button
                                        onClick={() => handleImageClick(getKwitansiUrl(history.kwitansi_path), `Bukti Pembayaran #${index + 1}`)}
                                        className="text-xs text-blue-600 hover:underline mt-1"
                                      >
                                        📄 Lihat bukti
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-gray-500">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-gray-400">💰</span>
                              </div>
                              <p className="text-sm">Belum ada riwayat pembayaran</p>
                              <p className="text-xs text-gray-400">Riwayat akan muncul setelah pembayaran pertama</p>
                            </div>
                          )}
                        </div>

                        {/* Summary Total */}
                        {paymentHistory.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">
                                Total {paymentHistory.length} pembayaran:
                              </span>
                              <span className="text-lg font-bold text-green-600">
                                Rp {paymentHistory.reduce((total, history) => total + (history.jumlah_dibayar || 0), 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 text-xs">ℹ️</span>
                          </div>
                          <h3 className="font-semibold">Informasi Input</h3>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500">Waktu Input Data</p>
                            <p className="font-medium">
                              {new Date().toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'long', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} WIB
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Diupload Oleh</p>
                            <p className="font-medium">{getCurrentUser()?.nama || 'Admin'}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Metode Pembayaran</p>
                            <p className="font-medium">{selectedPayment.metode_bayar || 'Transfer'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal untuk Melihat Gambar Besar */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent onClose={() => setShowImageModal(false)} className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
          {selectedImage && (
            <>
              <DialogHeader className="p-6 pb-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{selectedImage.title}</DialogTitle>
                </div>
              </DialogHeader>
              
              <div className="p-6 pt-4">
                <div className="flex justify-center">
                  <img 
                    src={selectedImage.src}
                    alt={selectedImage.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }}
                  />
                  <div className="text-center py-12" style={{display: 'none'}}>
                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Gambar tidak dapat dimuat</p>
                    <p className="text-gray-500 text-sm">File mungkin telah dipindah atau dihapus</p>
                  </div>
                </div>
                
                <div className="flex justify-center gap-3 mt-6">
                  <Button variant="outline" onClick={() => window.open(selectedImage.src, '_blank')}>
                    🔗 Buka di Tab Baru
                  </Button>
                  <Button variant="outline" onClick={() => {
                    const link = document.createElement('a')
                    link.href = selectedImage.src
                    link.download = selectedImage.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
                    link.click()
                  }}>
                    📥 Download
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal untuk Tambah Pembayaran */}
      <Dialog open={showAddPaymentModal} onOpenChange={setShowAddPaymentModal}>
        <DialogContent onClose={() => setShowAddPaymentModal(false)} className="max-w-2xl">
          {selectedPayment && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">Tambah Pembayaran</DialogTitle>
                    <p className="text-gray-500 text-sm mt-1">
                      Untuk: {selectedPayment.nama_penyewa}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 pt-0">
                {/* Info Pembayaran Saat Ini */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Informasi Pembayaran Saat Ini</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Total yang Harus Dibayar:</span>
                      <p className="font-semibold">Rp {selectedPayment.nominal?.toLocaleString('id-ID') || '0'}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Sudah Dibayar:</span>
                      <p className="font-semibold">Rp {(selectedPayment.uang_dibayar || selectedPayment.nominal || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Sisa:</span>
                      <p className="font-semibold text-orange-600">
                        Rp {Math.max(0, (selectedPayment.nominal || 0) - (selectedPayment.uang_dibayar || selectedPayment.nominal || 0)).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-700">Status:</span>
                      <p className={`font-semibold ${getStatusPembayaran(selectedPayment.nominal, selectedPayment.uang_dibayar).color}`}>
                        {getStatusPembayaran(selectedPayment.nominal, selectedPayment.uang_dibayar).status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Tambah Pembayaran */}
                <form onSubmit={handleSubmitAddPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Tambahan yang Dibayar *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                      <Input
                        type="number"
                        value={addPaymentData.jumlah_tambahan}
                        onChange={(e) => setAddPaymentData({...addPaymentData, jumlah_tambahan: e.target.value})}
                        className="pl-10"
                        placeholder="Masukkan jumlah tambahan"
                        required
                        min="1"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Jumlah uang tambahan yang akan ditambahkan ke pembayaran
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Transfer', 'Tunai', 'E-Wallet'].map(metode => (
                        <button
                          key={metode}
                          type="button"
                          onClick={() => setAddPaymentData({...addPaymentData, metode_bayar: metode})}
                          className={`p-3 rounded-lg border text-sm font-medium ${
                            addPaymentData.metode_bayar === metode
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {metode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan (Opsional)</label>
                    <textarea
                      value={addPaymentData.keterangan}
                      onChange={(e) => setAddPaymentData({...addPaymentData, keterangan: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      rows="3"
                      placeholder="Catatan tambahan untuk pembayaran ini..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bukti Pembayaran Tambahan</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleAddPaymentFileChange}
                        id="add-payment-file"
                        className="hidden"
                      />
                      <label htmlFor="add-payment-file" className="cursor-pointer">
                        {addPaymentPreview ? (
                          <div className="space-y-2">
                            {addPaymentFile?.type?.includes('image') ? (
                              <img src={addPaymentPreview} alt="Preview" className="max-h-24 mx-auto rounded" />
                            ) : (
                              <FileText className="w-8 h-8 mx-auto text-blue-600" />
                            )}
                            <p className="text-sm text-gray-600">{addPaymentFile?.name}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-gray-400" />
                            <div>
                              <p className="text-blue-600 font-medium text-sm">Klik untuk upload bukti</p>
                              <p className="text-xs text-gray-500">PNG, JPG atau PDF (Maks. 5MB)</p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Preview Hasil */}
                  {addPaymentData.jumlah_tambahan && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Preview Setelah Pembayaran:</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Total Dibayar Baru:</span>
                          <span className="font-semibold">
                            Rp {((selectedPayment.uang_dibayar || selectedPayment.nominal || 0) + parseFloat(addPaymentData.jumlah_tambahan || 0)).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sisa Baru:</span>
                          <span className="font-semibold">
                            Rp {Math.max(0, (selectedPayment.nominal || 0) - ((selectedPayment.uang_dibayar || selectedPayment.nominal || 0) + parseFloat(addPaymentData.jumlah_tambahan || 0))).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status Baru:</span>
                          <span className={`font-semibold ${
                            ((selectedPayment.uang_dibayar || selectedPayment.nominal || 0) + parseFloat(addPaymentData.jumlah_tambahan || 0)) >= (selectedPayment.nominal || 0)
                              ? 'text-green-600' 
                              : 'text-orange-600'
                          }`}>
                            {((selectedPayment.uang_dibayar || selectedPayment.nominal || 0) + parseFloat(addPaymentData.jumlah_tambahan || 0)) >= (selectedPayment.nominal || 0) ? 'LUNAS' : 'KURANG BAYAR'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowAddPaymentModal(false)}>
                      Batal
                    </Button>
                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                      Tambah Pembayaran
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Pembayaran