# 🚀 Panduan Deploy Frontend ke Vercel

## 📋 Persiapan Sebelum Deploy

### 1. Pastikan Supabase Storage Buckets Sudah Dibuat
Buka Supabase Dashboard → Storage → Create Bucket:

```
1. properti-photos (Public)
2. ktp-documents (Private) 
3. kwitansi-receipts (Private)
```

### 2. Setup Storage Policies di Supabase
Buka Supabase Dashboard → Storage → Policies:

**Untuk bucket `properti-photos` (Public):**
```sql
-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'properti-photos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'properti-photos');
```

**Untuk bucket `ktp-documents` dan `kwitansi-receipts` (Private):**
```sql
-- Allow authenticated read access
CREATE POLICY "Authenticated read access" ON storage.objects
FOR SELECT USING (bucket_id = 'ktp-documents');

CREATE POLICY "Authenticated read access" ON storage.objects
FOR SELECT USING (bucket_id = 'kwitansi-receipts');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'ktp-documents');

CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'kwitansi-receipts');
```

## 🌐 Deploy ke Vercel

### Metode 1: Deploy via GitHub (Recommended)

#### Step 1: Push ke GitHub
```bash
# Jika belum ada git repository
git init
git add .
git commit -m "Initial commit - KontrakanKu with Supabase"

# Buat repository baru di GitHub, lalu:
git remote add origin https://github.com/USERNAME/kontrakanku.git
git branch -M main
git push -u origin main
```

#### Step 2: Connect ke Vercel
1. Buka [vercel.com](https://vercel.com)
2. Login dengan GitHub account
3. Klik "New Project"
4. Import repository "kontrakanku"
5. Set **Root Directory** ke `frontend`
6. Framework Preset: **Vite**

#### Step 3: Environment Variables
Di Vercel Dashboard → Settings → Environment Variables, tambahkan:

```
VITE_SUPABASE_URL = https://nxaorkpaaiewyykoxyiw.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW9ya3BhYWlld3l5a294eWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTkyMDksImV4cCI6MjA4NDUzNTIwOX0.QCTxTGvOL5CFVqjFYGxFzZWq1vwxfM8iTkX1b1K4Vng
```

#### Step 4: Deploy
Klik "Deploy" - Vercel akan otomatis build dan deploy!

### Metode 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Login ke Vercel
```bash
vercel login
```

#### Step 3: Deploy dari folder frontend
```bash
cd frontend
vercel
```

Ikuti prompt:
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- Project name: **kontrakanku**
- In which directory is your code located? **./frontend**

#### Step 4: Set Environment Variables
```bash
vercel env add VITE_SUPABASE_URL
# Masukkan: https://nxaorkpaaiewyykoxyiw.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Masukkan: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW9ya3BhYWlld3l5a294eWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTkyMDksImV4cCI6MjA4NDUzNTIwOX0.QCTxTGvOL5CFVqjFYGxFzZWq1vwxfM8iTkX1b1K4Vng
```

#### Step 5: Redeploy dengan Environment Variables
```bash
vercel --prod
```

## 🔧 Konfigurasi Tambahan

### 1. Custom Domain (Opsional)
Di Vercel Dashboard → Settings → Domains:
- Tambahkan domain custom Anda
- Update DNS records sesuai instruksi Vercel

### 2. Build Settings
Pastikan di `frontend/package.json` ada:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 3. Vercel Configuration (Opsional)
Buat file `frontend/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

## ✅ Testing Deployment

### 1. Cek URL Deployment
Setelah deploy berhasil, Vercel akan memberikan URL seperti:
```
https://kontrakanku-xxx.vercel.app
```

### 2. Test Fitur Utama
- ✅ Login (mamah/123, admin/321, demo/demo123)
- ✅ Dashboard statistics
- ✅ CRUD Properti
- ✅ CRUD Penyewa
- ✅ CRUD Pembayaran
- ✅ Upload file (foto properti, KTP, kwitansi)

### 3. Cek Console Browser
Buka Developer Tools → Console, pastikan tidak ada error.

## 🚨 Troubleshooting

### Error: "Failed to fetch"
- Cek environment variables di Vercel
- Pastikan Supabase URL dan API key benar

### Error: "Storage bucket not found"
- Buat storage buckets di Supabase Dashboard
- Setup storage policies

### Error: "Build failed"
- Cek `package.json` di folder frontend
- Pastikan semua dependencies terinstall

### Error: "404 on refresh"
- Tambahkan `vercel.json` dengan rewrites configuration

## 📱 PWA Setup (Bonus)

Aplikasi sudah support PWA! Setelah deploy:
1. Buka di mobile browser
2. Klik "Add to Home Screen"
3. Aplikasi bisa digunakan seperti native app

## 🎉 Selesai!

Aplikasi KontrakanKu sekarang sudah live di Vercel dengan:
- ✅ Supabase backend
- ✅ File storage
- ✅ Real-time database
- ✅ PWA support
- ✅ Custom domain (opsional)

**URL Demo:** https://kontrakanku-xxx.vercel.app
**Login:** mamah/123 atau admin/321