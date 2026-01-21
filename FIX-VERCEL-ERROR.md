# 🔧 Fix Error: Function Runtimes must have a valid version

## 🚨 Masalah
Error "Function Runtimes must have a valid version" disebabkan oleh konfigurasi yang tidak valid di `vercel.json`.

## ✅ Solusi Cepat

### Langkah 1: Push vercel.json yang sudah diperbaiki
```bash
git add vercel.json
git commit -m "Fix vercel.json configuration"
git push
```

### Langkah 2: Redeploy di Vercel Dashboard
1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project "My_Kontrakan"
3. Klik tab "Deployments"
4. Klik "..." pada deployment terakhir
5. Klik "Redeploy"

## 🎯 Alternatif: Deploy Manual via Vercel CLI

Jika masih error, coba deploy langsung dari folder frontend:

```bash
# Install Vercel CLI jika belum
npm install -g vercel

# Login ke Vercel
vercel login

# Deploy dari folder frontend
cd frontend
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
# Paste: https://nxaorkpaaiewyykoxyiw.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW9ya3BhYWlld3l5a294eWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTkyMDksImV4cCI6MjA4NDUzNTIwOX0.QCTxTGvOL5CFVqjFYGxFzZWq1vwxfM8iTkX1b1K4Vng

# Deploy production
vercel --prod
```

## 🔍 Cek Konfigurasi Vercel Dashboard

Pastikan di Vercel Dashboard → Settings → Build & Development Settings:

- **Framework Preset:** Vite
- **Root Directory:** frontend (atau kosongkan jika pakai vercel.json)
- **Build Command:** npm run build
- **Output Directory:** dist
- **Install Command:** npm install

## 📋 Environment Variables

Pastikan ada di Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL = https://nxaorkpaaiewyykoxyiw.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW9ya3BhYWlld3l5a294eWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTkyMDksImV4cCI6MjA4NDUzNTIwOX0.QCTxTGvOL5CFVqjFYGxFzZWq1vwxfM8iTkX1b1K4Vng
```

## 🚀 Hasil yang Diharapkan

Setelah berhasil deploy:
- Build berhasil tanpa error
- URL dapat diakses (https://my-kontrakan-xxx.vercel.app)
- Login berfungsi dengan mamah/123 atau admin/321
- Semua fitur CRUD berjalan normal

**Coba langkah 1-2 dulu, jika masih error gunakan alternatif Vercel CLI!**