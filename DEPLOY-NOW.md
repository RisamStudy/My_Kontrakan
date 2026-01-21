# 🚀 Deploy KontrakanKu Sekarang!

## 🎯 Pilihan Deployment

### Opsi 1: Deploy via Vercel CLI (Tercepat)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Login ke Vercel**
```bash
vercel login
```

**Step 3: Deploy**
```bash
cd frontend
vercel
```

Ikuti prompt:
- **Set up and deploy?** → Y
- **Which scope?** → Pilih account Anda
- **Link to existing project?** → N
- **What's your project's name?** → kontrakanku
- **In which directory is your code located?** → ./

**Step 4: Set Environment Variables**
```bash
vercel env add VITE_SUPABASE_URL
# Paste: https://nxaorkpaaiewyykoxyiw.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY  
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW9ya3BhYWlld3l5a294eWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTkyMDksImV4cCI6MjA4NDUzNTIwOX0.QCTxTGvOL5CFVqjFYGxFzZWq1vwxfM8iTkX1b1K4Vng
```

**Step 5: Deploy Production**
```bash
vercel --prod
```

### Opsi 2: Deploy via GitHub + Vercel Dashboard

**Step 1: Push ke GitHub**
```bash
git init
git add .
git commit -m "Deploy KontrakanKu with Supabase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kontrakanku.git
git push -u origin main
```

**Step 2: Connect ke Vercel**
1. Buka [vercel.com](https://vercel.com)
2. Login dengan GitHub
3. Klik "New Project"
4. Import repository "kontrakanku"
5. **PENTING:** Set Root Directory ke `frontend`
6. Framework Preset: Vite
7. Add Environment Variables:
   ```
   VITE_SUPABASE_URL = https://nxaorkpaaiewyykoxyiw.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YW9ya3BhYWlld3l5a294eWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTkyMDksImV4cCI6MjA4NDUzNTIwOX0.QCTxTGvOL5CFVqjFYGxFzZWq1vwxfM8iTkX1b1K4Vng
   ```
8. Klik "Deploy"

## ⚠️ PENTING: Setup Supabase Storage

**Sebelum test aplikasi, buat storage buckets di Supabase:**

1. Buka [Supabase Dashboard](https://supabase.com/dashboard/project/nxaorkpaaiewyykoxyiw)
2. Klik "Storage" di sidebar
3. Klik "Create Bucket"
4. Buat 3 buckets:

```
Bucket 1:
Name: properti-photos
Public: ✅ (centang)

Bucket 2: 
Name: ktp-documents
Public: ❌ (jangan centang)

Bucket 3:
Name: kwitansi-receipts  
Public: ❌ (jangan centang)
```

## 🧪 Test Deployment

Setelah deploy berhasil:

1. **Buka URL yang diberikan Vercel**
2. **Test Login:**
   - mamah / 123
   - admin / 321  
   - demo / demo123
3. **Test Fitur:**
   - Dashboard statistics
   - Tambah/edit properti
   - Tambah/edit penyewa
   - Tambah/edit pembayaran
   - Upload foto/dokumen

## 🎉 Selesai!

Aplikasi KontrakanKu sekarang sudah live dengan:
- ✅ Database Supabase
- ✅ File storage
- ✅ PWA support
- ✅ Auto SSL (HTTPS)
- ✅ Global CDN

**Pilih Opsi 1 atau 2 di atas dan mulai deploy!** 🚀

---

**Butuh bantuan?** Cek error di:
- Vercel build logs
- Browser console (F12)
- Supabase dashboard logs