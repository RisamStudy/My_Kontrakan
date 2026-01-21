# 🔧 Fix Vercel Deployment Error

## 🚨 Masalah yang Terjadi

Vercel mencoba build dari root directory, padahal aplikasi React ada di folder `frontend/`.

## ✅ Solusi 1: Update Project Settings di Vercel Dashboard

1. **Buka Vercel Dashboard**
   - Login ke [vercel.com](https://vercel.com)
   - Pilih project "My_Kontrakan"

2. **Update Settings**
   - Klik tab "Settings"
   - Scroll ke "Build & Development Settings"
   - Set **Root Directory** ke: `frontend`
   - Set **Framework Preset** ke: `Vite`
   - Set **Build Command** ke: `npm run build`
   - Set **Output Directory** ke: `dist`

3. **Redeploy**
   - Klik tab "Deployments"
   - Klik "..." pada deployment terakhir
   - Klik "Redeploy"

## ✅ Solusi 2: Buat vercel.json di Root Directory

Buat file `vercel.json` di root project (bukan di folder frontend):

```json
{
  "buildCommand": "cd frontend && npm ci && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm ci",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## ✅ Solusi 3: Pindahkan Frontend ke Root (Recommended)

Jika solusi 1 & 2 tidak berhasil, pindahkan semua file frontend ke root:

```bash
# Backup dulu
cp -r frontend frontend_backup

# Pindahkan semua file frontend ke root
mv frontend/* .
mv frontend/.* . 2>/dev/null || true

# Hapus folder frontend kosong
rmdir frontend

# Update .gitignore jika perlu
echo "node_modules/" >> .gitignore
echo "dist/" >> .gitignore
echo ".env.local" >> .gitignore
```

Lalu push ke GitHub:
```bash
git add .
git commit -m "Move frontend files to root for Vercel deployment"
git push
```

## 🔍 Cek Environment Variables

Pastikan di Vercel Dashboard → Settings → Environment Variables ada:

```
VITE_SUPABASE_URL = https://nxaorkpaaiewyykoxyiw.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW9ya3BhYWlld3l5a294eWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTkyMDksImV4cCI6MjA4NDUzNTIwOX0.QCTxTGvOL5CFVqjFYGxFzZWq1vwxfM8iTkX1b1K4Vng
```

## 🚀 Test Deployment

Setelah fix, coba deploy ulang dan cek:
- Build berhasil tanpa error
- URL dapat diakses
- Login berfungsi
- Semua fitur CRUD berjalan

## 📞 Jika Masih Error

Kirim screenshot dari:
1. Vercel build logs (tab Deployments)
2. Vercel project settings
3. Error message lengkap

**Coba Solusi 1 dulu, jika tidak berhasil lanjut ke Solusi 2, terakhir Solusi 3.**