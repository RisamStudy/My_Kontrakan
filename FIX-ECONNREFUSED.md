# 🔧 Fix Error ECONNREFUSED

## 🔍 **Penyebab Error:**
Error `ECONNREFUSED` terjadi karena frontend masih mencoba mengakses backend Go yang tidak berjalan, padahal kita sudah migrasi ke Supabase.

## ✅ **Yang Sudah Diperbaiki:**
- ✅ Login.jsx → Supabase ✅
- ✅ Dashboard.jsx → Supabase ✅

## ❌ **Yang Masih Error:**
- ❌ Properti.jsx → masih coba akses `/api/properti`
- ❌ Penyewa.jsx → masih coba akses `/api/penyewa`
- ❌ Pembayaran.jsx → masih coba akses `/api/pembayaran`

## 🚀 **Solusi Cepat:**

### **Opsi 1: Sementara Jalankan Backend Go**
Jika ingin test cepat tanpa error:
```bash
cd backend
go run main.go
```

### **Opsi 2: Update Semua ke Supabase (Recommended)**

**Langkah:**
1. ✅ Setup Supabase project dulu
2. ✅ Update .env.local dengan URL & API key yang benar
3. ✅ Import schema ke Supabase
4. ✅ Update semua pages ke Supabase

## 🎯 **Prioritas:**

### **PENTING: Setup Supabase Dulu!**
Sebelum lanjut, pastikan:
1. **Supabase project sudah dibuat**
2. **File .env.local sudah diisi dengan benar**
3. **Database schema sudah diimport**

### **Cek Environment Variables:**
Buka file `frontend/.env.local` dan pastikan:
```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ganti `your-actual-project-id` dengan ID project Supabase Anda!**

## 🔄 **Test Login Dulu:**

1. **Pastikan Supabase sudah setup**
2. **Jalankan frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
3. **Test login dengan: demo / demo123**
4. **Jika login berhasil, lanjut update pages lainnya**

## 📞 **Bantuan:**

Jika masih error:
1. **Screenshot error di browser console**
2. **Pastikan .env.local sudah benar**
3. **Cek apakah Supabase project sudah siap**

---

**Intinya: Setup Supabase dulu, baru fix error ini! 🚀**