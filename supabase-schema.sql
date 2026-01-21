-- =============================================
-- KONTRAKANKU SUPABASE SCHEMA
-- Schema untuk Supabase PostgreSQL
-- =============================================

-- =============================================
-- TABEL PROPERTI
-- =============================================
CREATE TABLE IF NOT EXISTS properti (
    id BIGSERIAL PRIMARY KEY,
    nama_unit VARCHAR(100) NOT NULL,
    tipe VARCHAR(50) NOT NULL DEFAULT 'Studio',
    harga_sewa DECIMAL(12,2) NOT NULL DEFAULT 0,
    foto_path VARCHAR(255) NULL,
    status VARCHAR(20) DEFAULT 'kosong' CHECK (status IN ('kosong', 'terisi', 'maintenance')),
    deskripsi TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABEL PENYEWA
-- =============================================
CREATE TABLE IF NOT EXISTS penyewa (
    id BIGSERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nik VARCHAR(16) NULL,
    email VARCHAR(100) NULL,
    telepon VARCHAR(20) NOT NULL,
    alamat TEXT NULL,
    properti_id BIGINT NULL,
    mulai_kontrak DATE NULL,
    jatuh_tempo DATE NULL,
    status_bayar VARCHAR(20) DEFAULT 'belum_bayar' CHECK (status_bayar IN ('lunas', 'hutang', 'belum_bayar')),
    ktp_path VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    FOREIGN KEY (properti_id) REFERENCES properti(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =============================================
-- TABEL PEMBAYARAN
-- =============================================
CREATE TABLE IF NOT EXISTS pembayaran (
    id BIGSERIAL PRIMARY KEY,
    penyewa_id BIGINT NOT NULL,
    nominal DECIMAL(12,2) NOT NULL,
    uang_dibayar DECIMAL(12,2) NULL,
    tanggal_bayar DATE NOT NULL,
    tanggal_mulai DATE NULL,
    tanggal_akhir DATE NULL,
    metode_bayar VARCHAR(50) DEFAULT 'Transfer',
    kwitansi_path VARCHAR(255) NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('lunas', 'pending', 'ditolak')),
    keterangan TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    FOREIGN KEY (penyewa_id) REFERENCES penyewa(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =============================================
-- TABEL RIWAYAT PEMBAYARAN
-- =============================================
CREATE TABLE IF NOT EXISTS riwayat_pembayaran (
    id BIGSERIAL PRIMARY KEY,
    pembayaran_id BIGINT NOT NULL,
    jumlah_dibayar DECIMAL(12,2) NOT NULL,
    tanggal_bayar TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metode_bayar VARCHAR(50) DEFAULT 'Transfer',
    kwitansi_path VARCHAR(255) NULL,
    keterangan TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    FOREIGN KEY (pembayaran_id) REFERENCES pembayaran(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =============================================
-- TABEL ADMIN (untuk login)
-- =============================================
CREATE TABLE IF NOT EXISTS admin (
    id BIGSERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'demo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FUNCTIONS UNTUK AUTO UPDATE TIMESTAMP
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- TRIGGERS UNTUK AUTO UPDATE
-- =============================================
CREATE TRIGGER update_properti_updated_at 
    BEFORE UPDATE ON properti 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_penyewa_updated_at 
    BEFORE UPDATE ON penyewa 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pembayaran_updated_at 
    BEFORE UPDATE ON pembayaran 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_updated_at 
    BEFORE UPDATE ON admin 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INDEX UNTUK PERFORMA
-- =============================================
CREATE INDEX IF NOT EXISTS idx_penyewa_email ON penyewa(email);
CREATE INDEX IF NOT EXISTS idx_penyewa_nik ON penyewa(nik);
CREATE INDEX IF NOT EXISTS idx_penyewa_properti_id ON penyewa(properti_id);
CREATE INDEX IF NOT EXISTS idx_penyewa_status_bayar ON penyewa(status_bayar);
CREATE INDEX IF NOT EXISTS idx_pembayaran_penyewa_id ON pembayaran(penyewa_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_tanggal_bayar ON pembayaran(tanggal_bayar);
CREATE INDEX IF NOT EXISTS idx_pembayaran_status ON pembayaran(status);
CREATE INDEX IF NOT EXISTS idx_riwayat_pembayaran_id ON riwayat_pembayaran(pembayaran_id);
CREATE INDEX IF NOT EXISTS idx_riwayat_tanggal_bayar ON riwayat_pembayaran(tanggal_bayar);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE properti ENABLE ROW LEVEL SECURITY;
ALTER TABLE penyewa ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE riwayat_pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- Policy untuk akses penuh (sementara untuk development)
CREATE POLICY "Enable all access for all users" ON properti FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON penyewa FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON pembayaran FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON riwayat_pembayaran FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON admin FOR ALL USING (true);

-- =============================================
-- DATA SAMPLE UNTUK TESTING
-- =============================================

-- Insert sample properti
INSERT INTO properti (nama_unit, tipe, harga_sewa, status, deskripsi) VALUES
('Unit A1', 'Studio', 1500000, 'kosong', 'Studio 25m² dengan kamar mandi dalam'),
('Unit A2', 'Studio', 1500000, 'terisi', 'Studio 25m² dengan kamar mandi dalam'),
('Unit B1', '1 Kamar', 2000000, 'kosong', '1 kamar tidur, ruang tamu, kamar mandi dalam'),
('Unit B2', '1 Kamar', 2000000, 'kosong', '1 kamar tidur, ruang tamu, kamar mandi dalam'),
('Unit C1', '2 Kamar', 2500000, 'maintenance', '2 kamar tidur, ruang tamu, dapur, kamar mandi')
ON CONFLICT DO NOTHING;

-- Insert sample penyewa
INSERT INTO penyewa (nama, nik, email, telepon, alamat, properti_id, mulai_kontrak, jatuh_tempo, status_bayar) VALUES
('Ahmad Rizki', '3201234567890123', 'ahmad.rizki@email.com', '081234567890', 'Jl. Merdeka No. 123, Jakarta Pusat', 2, '2024-01-01', '2024-02-01', 'lunas'),
('Siti Nurhaliza', '3301234567890124', 'siti.nur@email.com', '081234567891', 'Jl. Sudirman No. 456, Jakarta Selatan', NULL, NULL, NULL, 'belum_bayar')
ON CONFLICT DO NOTHING;

-- Insert sample pembayaran
INSERT INTO pembayaran (penyewa_id, nominal, tanggal_bayar, metode_bayar, status, keterangan) VALUES
(1, 1500000, '2024-01-01', 'Transfer', 'lunas', 'Pembayaran sewa bulan Januari 2024'),
(1, 1500000, '2024-02-01', 'Transfer', 'lunas', 'Pembayaran sewa bulan Februari 2024')
ON CONFLICT DO NOTHING;

-- Insert admin default (password: 123, 321, demo123)
INSERT INTO admin (nama, email, password, role) VALUES
('Mamah', 'mamah@kontrakanku.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Admin', 'admin@kontrakanku.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Demo User', 'demo@kontrakanku.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'demo')
ON CONFLICT (email) DO NOTHING;