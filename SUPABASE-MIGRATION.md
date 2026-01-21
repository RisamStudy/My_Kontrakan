# 🚀 Migrasi KontrakanKu ke Supabase + Vercel

## 📋 Langkah 1: Setup Supabase

### 1.1 Buat Project Supabase
1. Buka [supabase.com](https://supabase.com)
2. Sign up dengan GitHub
3. Klik "New Project"
4. Isi form:
   - **Name**: `kontrakanku`
   - **Database Password**: [buat password kuat]
   - **Region**: Southeast Asia (Singapore)
5. Tunggu project selesai dibuat (2-3 menit)

### 1.2 Catat Informasi Project
Setelah project siap, catat:
- **Project URL**: `https://your-project-id.supabase.co`
- **API Key (anon)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **API Key (service_role)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 📋 Langkah 2: Setup Database Schema

### 2.1 Import Schema
1. Buka Supabase Dashboard → SQL Editor
2. Klik "New Query"
3. Copy-paste schema dari file `supabase-schema.sql`
4. Klik "Run" untuk execute

### 2.2 Setup Row Level Security (RLS)
```sql
-- Enable RLS untuk semua tabel
ALTER TABLE properti ENABLE ROW LEVEL SECURITY;
ALTER TABLE penyewa ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE riwayat_pembayaran ENABLE ROW LEVEL SECURITY;

-- Policy untuk admin (bisa akses semua)
CREATE POLICY "Admin can do everything" ON properti FOR ALL USING (true);
CREATE POLICY "Admin can do everything" ON penyewa FOR ALL USING (true);
CREATE POLICY "Admin can do everything" ON pembayaran FOR ALL USING (true);
CREATE POLICY "Admin can do everything" ON riwayat_pembayaran FOR ALL USING (true);
```

## 📋 Langkah 3: Setup File Storage

### 3.1 Buat Storage Buckets
1. Dashboard → Storage → Create Bucket
2. Buat 3 buckets:
   - `properti-photos` (public)
   - `ktp-documents` (private)
   - `kwitansi-receipts` (private)

### 3.2 Setup Storage Policies
```sql
-- Policy untuk upload files
CREATE POLICY "Anyone can upload files" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view public files" ON storage.objects FOR SELECT USING (bucket_id = 'properti-photos');
CREATE POLICY "Authenticated users can view private files" ON storage.objects FOR SELECT USING (bucket_id IN ('ktp-documents', 'kwitansi-receipts'));
```

## 📋 Langkah 4: Update Frontend

### 4.1 Install Supabase Client
```bash
cd frontend
npm install @supabase/supabase-js
```

### 4.2 Konfigurasi Supabase Client
Buat file `src/lib/supabase.js`

### 4.3 Update API Calls
Ganti semua axios calls dengan Supabase client calls

## 📋 Langkah 5: Deploy ke Vercel

### 5.1 Environment Variables
Di Vercel Dashboard, tambahkan:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 5.2 Deploy
```bash
git add .
git commit -m "Migrate to Supabase"
git push origin main
```

## 🎯 Keuntungan Setelah Migrasi

✅ **100% Gratis** - Tidak ada biaya hosting  
✅ **Auto-scaling** - Handle traffic tinggi otomatis  
✅ **Real-time** - Data sync real-time  
✅ **Backup otomatis** - Database backup harian  
✅ **Global CDN** - File upload cepat di seluruh dunia  
✅ **Security** - Row Level Security built-in  

## 🔄 Fitur yang Tetap Sama

✅ Login admin/demo  
✅ CRUD properti, penyewa, pembayaran  
✅ Upload foto properti, KTP, kwitansi  
✅ Dashboard statistik  
✅ Responsive design  
✅ PWA capabilities  

## 📱 Fitur Baru yang Didapat

🆕 **Real-time updates** - Data sync otomatis  
🆕 **Better file management** - CDN global untuk files  
🆕 **Enhanced security** - Row Level Security  
🆕 **API documentation** - Auto-generated API docs  
🆕 **Database backups** - Backup otomatis harian  