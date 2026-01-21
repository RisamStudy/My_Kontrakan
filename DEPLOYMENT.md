# 🚀 Panduan Deployment KontrakanKu

Panduan lengkap untuk deploy aplikasi KontrakanKu dengan:
- **Frontend**: Vercel (gratis)
- **Backend**: Render (gratis) 
- **Database**: MySQL di Render (gratis)

## 📋 Persiapan

### 1. Akun yang Diperlukan
- [GitHub](https://github.com) - untuk menyimpan kode
- [Vercel](https://vercel.com) - untuk frontend
- [Render](https://render.com) - untuk backend & database

### 2. Push Kode ke GitHub
```bash
# Inisialisasi git (jika belum)
git init
git add .
git commit -m "Initial commit"

# Buat repository di GitHub, lalu:
git remote add origin https://github.com/username/kontrakanku.git
git branch -M main
git push -u origin main
```

## 🗄️ Deploy Database (Render)

### 1. Buat Database MySQL
1. Login ke [Render Dashboard](https://dashboard.render.com)
2. Klik **"New +"** → **"PostgreSQL"** (MySQL tidak tersedia gratis, gunakan PostgreSQL)
3. Isi form:
   - **Name**: `kontrakanku-db`
   - **Database**: `kontrakanku`
   - **User**: `kontrakanku`
   - **Region**: Singapore (terdekat dengan Indonesia)
   - **Plan**: Free
4. Klik **"Create Database"**
5. Tunggu hingga status menjadi **"Available"**
6. Catat informasi koneksi (Host, Port, Database, Username, Password)

### 2. Setup Database Schema
1. Gunakan tool seperti pgAdmin atau DBeaver untuk connect ke database
2. Jalankan script SQL dari file `backend/schema.sql`
3. Pastikan semua tabel terbuat dengan benar

## 🔧 Deploy Backend (Render)

### 1. Deploy Backend Service
1. Di Render Dashboard, klik **"New +"** → **"Web Service"**
2. Connect GitHub repository Anda
3. Isi form:
   - **Name**: `kontrakanku-api`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Go
   - **Build Command**: `go build -o main .`
   - **Start Command**: `./main`
4. Tambahkan Environment Variables:
   ```
   PORT=8080
   GIN_MODE=release
   DB_HOST=[dari database info]
   DB_PORT=[dari database info]
   DB_USER=[dari database info]
   DB_PASSWORD=[dari database info]
   DB_NAME=[dari database info]
   ```
5. Klik **"Create Web Service"**

### 2. Verifikasi Backend
- Tunggu hingga deploy selesai
- Akses `https://your-backend-url.onrender.com/api/dashboard/stats`
- Pastikan mendapat response JSON

## 🌐 Deploy Frontend (Vercel)

### 1. Deploy ke Vercel
1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik **"New Project"**
3. Import repository GitHub Anda
4. Isi konfigurasi:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Tambahkan Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
6. Klik **"Deploy"**

### 2. Update CORS Backend
1. Edit `backend/main.go`
2. Ganti URL Vercel di `corsMiddleware()`:
   ```go
   "https://your-frontend-url.vercel.app"
   ```
3. Commit dan push ke GitHub
4. Backend akan auto-redeploy

## 📱 Setup untuk Mobile (WebView/APK)

### 1. PWA (Progressive Web App)
Frontend sudah dikonfigurasi sebagai PWA. User bisa:
1. Buka website di mobile browser
2. Tap menu browser → "Add to Home Screen"
3. Aplikasi akan muncul seperti native app

### 2. Buat APK (Opsional)
Gunakan tools seperti:
- **Capacitor**: Framework hybrid app
- **Cordova**: Wrapper WebView
- **PWA Builder**: Microsoft tool untuk convert PWA ke APK

## 🔧 Konfigurasi Production

### 1. Update Frontend untuk Production
Buat file `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

### 2. Update Backend CORS
Pastikan CORS mengizinkan domain production:
```go
allowedOrigins := []string{
    "https://your-frontend-url.vercel.app",
    "http://localhost:5173", // untuk development
}
```

## 🧪 Testing

### 1. Test Fitur Utama
- ✅ Login (admin/321, demo/demo123)
- ✅ Upload foto properti
- ✅ Upload foto KTP penyewa  
- ✅ Upload kwitansi pembayaran
- ✅ CRUD semua data
- ✅ Responsive design

### 2. Test Mobile
- ✅ Akses via mobile browser
- ✅ Add to home screen
- ✅ Upload foto dari kamera
- ✅ Touch interactions

## 🚨 Troubleshooting

### Backend Issues
```bash
# Cek logs di Render Dashboard
# Pastikan environment variables benar
# Cek koneksi database
```

### Frontend Issues
```bash
# Cek Vercel deployment logs
# Pastikan VITE_API_URL benar
# Test CORS dengan browser dev tools
```

### Database Issues
```bash
# Cek koneksi string
# Pastikan database schema sudah dijalankan
# Cek firewall/security groups
```

## 📊 Monitoring

### 1. Render (Backend)
- Dashboard menampilkan CPU, Memory usage
- Logs real-time
- Uptime monitoring

### 2. Vercel (Frontend)  
- Analytics traffic
- Performance metrics
- Error tracking

## 💰 Biaya

### Free Tier Limits:
- **Render**: 750 jam/bulan, sleep setelah 15 menit idle
- **Vercel**: 100GB bandwidth, unlimited requests
- **Database**: 1GB storage, 97 jam uptime/bulan

### Tips Menghemat:
- Backend akan sleep otomatis saat tidak digunakan
- Database PostgreSQL gratis terbatas, pertimbangkan upgrade jika perlu
- Gunakan CDN untuk file statis

## 🔄 CI/CD

### Auto Deploy:
- **Frontend**: Auto deploy saat push ke `main` branch
- **Backend**: Auto deploy saat push ke `main` branch
- **Database**: Manual migration via SQL scripts

### Workflow:
1. Development di local
2. Push ke GitHub
3. Auto deploy ke staging/production
4. Test di production URL
5. Update DNS jika perlu

## 🌍 Custom Domain (Opsional)

### 1. Vercel Custom Domain
1. Beli domain (Namecheap, GoDaddy, dll)
2. Di Vercel Dashboard → Project → Settings → Domains
3. Tambahkan domain dan ikuti instruksi DNS

### 2. Render Custom Domain  
1. Di Render Dashboard → Service → Settings → Custom Domains
2. Tambahkan domain dan setup DNS CNAME

## 📞 Support

Jika ada masalah:
1. Cek logs di dashboard masing-masing platform
2. Pastikan environment variables benar
3. Test koneksi database
4. Cek CORS configuration

---

**Selamat! Aplikasi KontrakanKu Anda sudah live! 🎉**

Demo: https://your-app.vercel.app
- Login Admin: admin / 321
- Login Demo: demo / demo123