# Update API Calls untuk Production

Untuk menggunakan API instance yang terpusat, Anda perlu mengganti semua `axios.get('/api/...)` dengan `api.get('/api/...)` di file-file berikut:

## Files yang perlu diupdate:

### 1. frontend/src/pages/Dashboard.jsx
```javascript
// Tambahkan import
import api from '../lib/api'

// Ganti semua axios dengan api
const response = await api.get('/api/dashboard/stats')
const response = await api.get('/api/properti')
```

### 2. frontend/src/pages/Properti.jsx  
```javascript
// Tambahkan import
import api from '../lib/api'

// Ganti semua axios dengan api
const response = await api.get('/api/properti')
await api.post('/api/properti', formDataToSend, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
await api.put(`/api/properti/${editingId}`, formDataToSend, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
await api.delete(`/api/properti/${id}`)
```

### 3. frontend/src/pages/Penyewa.jsx
```javascript
// Tambahkan import  
import api from '../lib/api'

// Ganti semua axios dengan api
const response = await api.get('/api/penyewa')
await api.post('/api/penyewa', formDataToSend, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
await api.put(`/api/penyewa/${editingId}`, formDataToSend, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
await api.delete(`/api/penyewa/${id}`)
```

### 4. frontend/src/pages/Pembayaran.jsx
```javascript
// Tambahkan import
import api from '../lib/api'

// Ganti semua axios dengan api
const [penyewaRes, propertiRes, pembayaranRes] = await Promise.all([
  api.get('/api/penyewa'),
  api.get('/api/properti'), 
  api.get('/api/pembayaran')
])
await api.post('/api/pembayaran', kontrakData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
await api.put(`/api/pembayaran/${editingId}`, kontrakData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
await api.delete(`/api/pembayaran/${id}`)
const response = await api.get(`/api/pembayaran/${id}/riwayat`)
await api.post(`/api/pembayaran/${id}/riwayat`, formDataToSend, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

### 5. frontend/src/pages/Login.jsx
```javascript
// Tambahkan import
import api from '../lib/api'

// Ganti axios dengan api
const response = await api.post('/api/auth/login', formData)
```

### 6. frontend/src/components/Layout.jsx
```javascript
// Tambahkan import
import api from '../lib/api'

// Ganti axios dengan api  
await api.post('/api/auth/logout')
```

## Cara cepat update semua file:

1. Buka setiap file yang disebutkan di atas
2. Tambahkan import: `import api from '../lib/api'`
3. Find & Replace: `axios.` → `api.`
4. Pastikan tidak ada error di console browser

Setelah update ini, aplikasi akan menggunakan base URL yang dinamis sesuai environment (development/production).