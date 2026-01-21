# 🚀 Langkah Selanjutnya - Setup Supabase + Vercel

## ✅ Yang Sudah Selesai:
- ✅ Supabase client terinstall
- ✅ Login page sudah diupdate untuk Supabase
- ✅ Database schema sudah siap
- ✅ Environment variables template sudah dibuat

## 🎯 Yang Harus Anda Lakukan Sekarang:

### **Step 1: Setup Supabase Project** ⭐ PENTING!

1. **Buka [supabase.com](https://supabase.com)**
2. **Sign up/Login** dengan GitHub account Anda
3. **Klik "New Project"**
4. **Isi form:**
   ```
   Organization: [pilih atau buat baru]
   Name: kontrakanku
   Database Password: [buat password kuat - CATAT!]
   Region: Southeast Asia (Singapore)
   Pricing Plan: Free
   ```
5. **Klik "Create new project"**
6. **Tunggu 2-3 menit** sampai project selesai

### **Step 2: Catat Informasi Project**

Setelah project siap:
1. **Buka Settings → API**
2. **Catat informasi ini:**
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### **Step 3: Update Environment Variables**

1. **Buka file `frontend/.env.local`**
2. **Ganti dengan nilai SEBENARNYA:**
   ```env
   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### **Step 4: Import Database Schema**

1. **Buka Supabase Dashboard → SQL Editor**
2. **Klik "New Query"**
3. **Copy SEMUA isi file `supabase-schema.sql`**
4. **Paste ke SQL Editor**
5. **Klik "Run"** untuk execute
6. **Pastikan tidak ada error**

### **Step 5: Setup Storage Buckets**

1. **Buka Dashboard → Storage**
2. **Buat 3 buckets:**
   ```
   properti-photos (Public)
   ktp-documents (Private)  
   kwitansi-receipts (Private)
   ```

### **Step 6: Test Login**

1. **Jalankan frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
2. **Buka http://localhost:5173**
3. **Test login dengan:**
   ```
   Username: demo
   Password: demo123
   ```

### **Step 7: Migrasi Pages Lainnya**

Setelah login berhasil, kita akan update:
- ✅ Login.jsx (sudah selesai)
- ⏳ Dashboard.jsx
- ⏳ Properti.jsx  
- ⏳ Penyewa.jsx
- ⏳ Pembayaran.jsx
- ⏳ Layout.jsx

## 🔧 Troubleshooting

### Jika Login Error:
1. **Cek Console Browser** (F12 → Console)
2. **Pastikan .env.local sudah benar**
3. **Pastikan schema sudah diimport**
4. **Cek Network tab untuk error API**

### Jika Supabase Connection Error:
1. **Pastikan Project URL benar**
2. **Pastikan API Key benar**
3. **Cek apakah project sudah selesai dibuat**

## 📞 Bantuan

Jika ada masalah:
1. **Screenshot error message**
2. **Cek browser console**
3. **Pastikan semua step sudah diikuti**

## 🎯 Target Akhir

Setelah semua selesai:
- ✅ Frontend berjalan di Vercel
- ✅ Database di Supabase
- ✅ File upload ke Supabase Storage
- ✅ 100% gratis selamanya
- ✅ Auto-scaling
- ✅ Global CDN

---

**Mulai dari Step 1 dulu ya! Setup Supabase project adalah yang paling penting.** 🚀