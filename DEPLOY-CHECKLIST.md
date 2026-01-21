# ✅ Checklist Deploy KontrakanKu ke Vercel

## 🔥 Quick Deploy (5 Menit)

### 1. Persiapan Supabase Storage
Buka [Supabase Dashboard](https://supabase.com/dashboard) → Storage:

**Buat 3 Buckets:**
```
✅ properti-photos (Public)
✅ ktp-documents (Private)  
✅ kwitansi-receipts (Private)
```

### 2. Deploy ke Vercel

**Opsi A: Via GitHub (Recommended)**
1. Push code ke GitHub repository
2. Buka [vercel.com](https://vercel.com) → New Project
3. Import repository → Set Root Directory: `frontend`
4. Add Environment Variables:
   ```
   VITE_SUPABASE_URL = https://nxaorkpaaiewyykoxyiw.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW9ya3BhYWlld3l5a294eWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTkyMDksImV4cCI6MjA4NDUzNTIwOX0.QCTxTGvOL5CFVqjFYGxFzZWq1vwxfM8iTkX1b1K4Vng
   ```
5. Deploy!

**Opsi B: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy dari folder frontend
cd frontend
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy production
vercel --prod
```

### 3. Test Deployment
Setelah deploy berhasil:
- ✅ Buka URL yang diberikan Vercel
- ✅ Test login: mamah/123 atau admin/321
- ✅ Test semua fitur CRUD
- ✅ Test upload file

## 🎯 Yang Sudah Siap Deploy

✅ **Frontend Migration Complete**
- Semua page sudah menggunakan Supabase
- File upload sudah menggunakan Supabase Storage
- Environment variables sudah dikonfigurasi
- Build configuration sudah benar

✅ **Database Ready**
- Supabase PostgreSQL dengan semua tabel
- Admin users sudah ada (mamah/123, admin/321, demo/demo123)
- Relasi antar tabel sudah benar

✅ **Files Ready**
- `vercel.json` untuk routing configuration
- `package.json` dengan build scripts
- Environment variables di `.env.local`

## 🚀 Hasil Akhir

Setelah deploy berhasil, Anda akan mendapat:
- **URL Live:** https://kontrakanku-xxx.vercel.app
- **PWA Support:** Bisa diinstall di mobile
- **Auto SSL:** HTTPS otomatis
- **Global CDN:** Loading cepat di seluruh dunia
- **Auto Deploy:** Setiap push ke GitHub otomatis deploy

## 📞 Support

Jika ada masalah saat deploy:
1. Cek Vercel build logs
2. Cek browser console untuk error
3. Pastikan Supabase storage buckets sudah dibuat
4. Pastikan environment variables sudah benar

**Ready to deploy? Pilih Opsi A atau B di atas!** 🚀