package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// Helper function to convert date format from ISO to MySQL format
func convertDateFormat(dateStr string) string {
	if dateStr == "" {
		return ""
	}
	
	// Try to parse ISO format with timezone
	if t, err := time.Parse(time.RFC3339, dateStr); err == nil {
		return t.Format("2006-01-02")
	}
	
	// Try to parse ISO format without timezone
	if t, err := time.Parse("2006-01-02T15:04:05", dateStr); err == nil {
		return t.Format("2006-01-02")
	}
	
	// Try to parse simple date format
	if t, err := time.Parse("2006-01-02", dateStr); err == nil {
		return t.Format("2006-01-02")
	}
	
	// If all parsing fails, return original string
	return dateStr
}

// Middleware untuk memeriksa apakah user adalah demo
func checkDemoUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ambil user agent atau header khusus untuk identifikasi
		// Untuk sederhananya, kita akan cek dari request body atau query
		
		// Skip untuk GET requests (read-only)
		if c.Request.Method == "GET" {
			c.Next()
			return
		}
		
		// Untuk POST, PUT, DELETE - cek apakah ini dari demo user
		// Kita akan menambahkan header khusus dari frontend
		userRole := c.GetHeader("X-User-Role")
		
		if userRole == "demo" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Akses ditolak. Akun demo hanya dapat melihat data, tidak dapat menambah, mengubah, atau menghapus data.",
				"code":  "DEMO_ACCESS_DENIED",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

type DashboardStats struct {
	TotalPendapatan float64 `json:"totalPendapatan"`
	UnitTerisi      int     `json:"unitTerisi"`
	TotalUnit       int     `json:"totalUnit"`
	JatuhTempo      int     `json:"jatuhTempo"`
}

type Properti struct {
	ID           int     `json:"id"`
	NamaUnit     string  `json:"nama_unit"`
	Tipe         string  `json:"tipe"`
	HargaSewa    float64 `json:"harga_sewa"`
	FotoPath     string  `json:"foto_path"`
	Status       string  `json:"status"`
	NamaPenyewa  string  `json:"nama_penyewa"`
	JatuhTempo   string  `json:"jatuh_tempo"`
}

type Penyewa struct {
	ID           int    `json:"id"`
	Nama         string `json:"nama"`
	NIK          string `json:"nik"`
	Email        string `json:"email"`
	Telepon      string `json:"telepon"`
	Alamat       string `json:"alamat"`
	PropertiID   int    `json:"properti_id"`
	NamaProperti string `json:"nama_properti"`
	FotoProperti string `json:"foto_properti"`
	MulaiKontrak string `json:"mulai_kontrak"`
	StatusBayar  string `json:"status_bayar"`
	KtpPath      string `json:"ktp_path"`
}

type Pembayaran struct {
	ID           int     `json:"id"`
	PenyewaID    int     `json:"penyewa_id"`
	NamaPenyewa  string  `json:"nama_penyewa"`
	Nominal      float64 `json:"nominal"`
	TanggalBayar string  `json:"tanggal_bayar"`
	MetodeBayar  string  `json:"metode_bayar"`
	KwitansiPath string  `json:"kwitansi_path"`
	Status       string  `json:"status"`
}

func getDashboardStats(c *gin.Context) {
	var stats DashboardStats
	
	fmt.Printf("=== CALCULATING DASHBOARD STATS ===\n")
	
	// Cek apakah kolom uang_dibayar ada
	var columnExists int
	db.QueryRow(`
		SELECT COUNT(*) 
		FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = DATABASE() 
		AND TABLE_NAME = 'pembayaran' 
		AND COLUMN_NAME = 'uang_dibayar'
	`).Scan(&columnExists)
	fmt.Printf("Column uang_dibayar exists: %d\n", columnExists)
	
	// 1. Total Pendapatan - sum dari uang_dibayar atau nominal jika uang_dibayar NULL
	var query string
	if columnExists > 0 {
		query = `
			SELECT CAST(COALESCE(SUM(
				CASE 
					WHEN uang_dibayar IS NOT NULL AND uang_dibayar > 0 THEN uang_dibayar 
					ELSE nominal 
				END
			), 0) AS DECIMAL(15,2)) as total_pendapatan
			FROM pembayaran`
	} else {
		query = `SELECT CAST(COALESCE(SUM(nominal), 0) AS DECIMAL(15,2)) FROM pembayaran`
	}
	
	err := db.QueryRow(query).Scan(&stats.TotalPendapatan)
	if err != nil {
		fmt.Printf("Error getting total pendapatan: %v\n", err)
		stats.TotalPendapatan = 0
	}
	fmt.Printf("Total Pendapatan: %.2f\n", stats.TotalPendapatan)

	// 2. Unit Terisi - count properti yang statusnya 'terisi'
	err = db.QueryRow(`
		SELECT COUNT(*) FROM properti WHERE status = 'terisi'
	`).Scan(&stats.UnitTerisi)
	if err != nil {
		fmt.Printf("Error getting unit terisi: %v\n", err)
		stats.UnitTerisi = 0
	}
	fmt.Printf("Unit Terisi: %d\n", stats.UnitTerisi)

	// 3. Total Unit - count semua properti
	err = db.QueryRow(`
		SELECT COUNT(*) FROM properti
	`).Scan(&stats.TotalUnit)
	if err != nil {
		fmt.Printf("Error getting total unit: %v\n", err)
		stats.TotalUnit = 0
	}
	fmt.Printf("Total Unit: %d\n", stats.TotalUnit)

	// 4. Jatuh Tempo (7 hari) - count pembayaran yang tanggal_akhir dalam 7 hari
	err = db.QueryRow(`
		SELECT COUNT(*) FROM pembayaran 
		WHERE tanggal_akhir IS NOT NULL 
		AND tanggal_akhir BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
	`).Scan(&stats.JatuhTempo)
	if err != nil {
		fmt.Printf("Error getting jatuh tempo: %v\n", err)
		stats.JatuhTempo = 0
	}
	fmt.Printf("Jatuh Tempo (7 hari): %d\n", stats.JatuhTempo)
	
	fmt.Printf("=== END DASHBOARD STATS ===\n")

	c.JSON(http.StatusOK, stats)
}

// PROPERTI HANDLERS
func getProperti(c *gin.Context) {
	rows, err := db.Query(`
		SELECT p.id, p.nama_unit, p.tipe, p.harga_sewa, 
		       COALESCE(p.foto_path, '') as foto_path, p.status,
		       COALESCE(py.nama, '') as nama_penyewa,
		       COALESCE(py.jatuh_tempo, '') as jatuh_tempo
		FROM properti p
		LEFT JOIN penyewa py ON p.id = py.properti_id
		ORDER BY p.id DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var propertiList []Properti
	for rows.Next() {
		var p Properti
		if err := rows.Scan(&p.ID, &p.NamaUnit, &p.Tipe, &p.HargaSewa, &p.FotoPath, &p.Status, &p.NamaPenyewa, &p.JatuhTempo); err != nil {
			continue
		}
		propertiList = append(propertiList, p)
	}

	c.JSON(http.StatusOK, propertiList)
}

func createProperti(c *gin.Context) {
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	namaUnit := c.PostForm("nama_unit")
	tipe := c.PostForm("tipe")
	hargaSewa := c.PostForm("harga_sewa")
	status := c.PostForm("status")

	var fotoPath string
	file, err := c.FormFile("foto")
	if err == nil {
		uploadDir := "./uploads/properti"
		os.MkdirAll(uploadDir, os.ModePerm)
		filename := time.Now().Format("20060102150405") + filepath.Ext(file.Filename)
		savePath := filepath.Join(uploadDir, filename)
		if err := c.SaveUploadedFile(file, savePath); err == nil {
			fotoPath = "/uploads/properti/" + filename
		}
	}

	result, err := db.Exec(
		"INSERT INTO properti (nama_unit, tipe, harga_sewa, foto_path, status) VALUES (?, ?, ?, ?, ?)",
		namaUnit, tipe, hargaSewa, fotoPath, status,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Properti created successfully"})
}

func updateProperti(c *gin.Context) {
	id := c.Param("id")
	
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	namaUnit := c.PostForm("nama_unit")
	tipe := c.PostForm("tipe")
	hargaSewa := c.PostForm("harga_sewa")
	status := c.PostForm("status")

	file, err := c.FormFile("foto")
	if err == nil {
		uploadDir := "./uploads/properti"
		os.MkdirAll(uploadDir, os.ModePerm)
		filename := time.Now().Format("20060102150405") + filepath.Ext(file.Filename)
		savePath := filepath.Join(uploadDir, filename)
		if err := c.SaveUploadedFile(file, savePath); err == nil {
			fotoPath := "/uploads/properti/" + filename
			db.Exec("UPDATE properti SET foto_path=? WHERE id=?", fotoPath, id)
		}
	}

	_, err = db.Exec(
		"UPDATE properti SET nama_unit=?, tipe=?, harga_sewa=?, status=? WHERE id=?",
		namaUnit, tipe, hargaSewa, status, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Properti updated successfully"})
}

func deleteProperti(c *gin.Context) {
	id := c.Param("id")
	
	_, err := db.Exec("DELETE FROM properti WHERE id=?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Properti deleted successfully"})
}

// PENYEWA HANDLERS
func getPenyewa(c *gin.Context) {
	rows, err := db.Query(`
		SELECT p.id, p.nama, COALESCE(p.nik, '') as nik, p.email, p.telepon, 
		       COALESCE(p.alamat, '') as alamat,
		       COALESCE(p.properti_id, 0) as properti_id,
		       COALESCE(pr.nama_unit, '') as nama_properti,
		       COALESCE(pr.foto_path, '') as foto_properti,
		       COALESCE(p.mulai_kontrak, '') as mulai_kontrak,
		       COALESCE(p.status_bayar, 'belum_bayar') as status_bayar,
		       COALESCE(p.ktp_path, '') as ktp_path,
		       COALESCE(pb.nominal, 0) as total_biaya,
		       COALESCE(pb.uang_dibayar, pb.nominal, 0) as uang_dibayar
		FROM penyewa p
		LEFT JOIN properti pr ON p.properti_id = pr.id
		LEFT JOIN pembayaran pb ON p.id = pb.penyewa_id
		ORDER BY p.id DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var penyewaList []map[string]interface{}
	for rows.Next() {
		var p Penyewa
		var mulaiKontrak string
		var totalBiaya, uangDibayar float64
		
		if err := rows.Scan(&p.ID, &p.Nama, &p.NIK, &p.Email, &p.Telepon, &p.Alamat, &p.PropertiID, &p.NamaProperti, &p.FotoProperti, &mulaiKontrak, &p.StatusBayar, &p.KtpPath, &totalBiaya, &uangDibayar); err != nil {
			continue
		}
		
		// Calculate real payment status
		var calculatedStatus string
		if uangDibayar >= totalBiaya && totalBiaya > 0 {
			calculatedStatus = "Lunas"
		} else if uangDibayar > 0 && totalBiaya > 0 {
			calculatedStatus = "Kurang Bayar"
		} else if totalBiaya > 0 {
			calculatedStatus = "Belum Bayar"
		} else {
			calculatedStatus = "Belum Ada Kontrak"
		}
		
		// Convert to map for flexibility
		penyewaItem := map[string]interface{}{
			"id":             p.ID,
			"nama":           p.Nama,
			"nik":            p.NIK,
			"email":          p.Email,
			"telepon":        p.Telepon,
			"alamat":         p.Alamat,
			"properti_id":    p.PropertiID,
			"nama_properti":  p.NamaProperti,
			"foto_properti":  p.FotoProperti,
			"mulai_kontrak":  mulaiKontrak,
			"status_bayar":   calculatedStatus, // Use calculated status
			"ktp_path":       p.KtpPath,
			"total_biaya":    totalBiaya,
			"uang_dibayar":   uangDibayar,
		}
		
		penyewaList = append(penyewaList, penyewaItem)
	}

	c.JSON(http.StatusOK, penyewaList)
}

func createPenyewa(c *gin.Context) {
	// Parse multipart form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		fmt.Printf("Failed to parse form: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form: " + err.Error()})
		return
	}

	nama := c.PostForm("nama")
	nik := c.PostForm("nik")
	email := c.PostForm("email")
	telepon := c.PostForm("telepon")
	alamat := c.PostForm("alamat")
	// Set default status bayar to valid ENUM value
	statusBayar := "belum_bayar"

	// Validasi input wajib
	if nama == "" || telepon == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama dan telepon wajib diisi"})
		return
	}

	// Debug log - tampilkan semua data yang diterima
	fmt.Printf("=== CREATE PENYEWA DEBUG ===\n")
	fmt.Printf("Nama: '%s'\n", nama)
	fmt.Printf("NIK: '%s'\n", nik)
	fmt.Printf("Email: '%s'\n", email)
	fmt.Printf("Telepon: '%s'\n", telepon)
	fmt.Printf("Alamat: '%s'\n", alamat)
	fmt.Printf("Status Bayar: '%s'\n", statusBayar)

	var ktpPath string
	file, err := c.FormFile("ktp")
	if err == nil {
		uploadDir := "./uploads/ktp"
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			fmt.Printf("Failed to create upload directory: %v\n", err)
		} else {
			filename := time.Now().Format("20060102150405") + filepath.Ext(file.Filename)
			savePath := filepath.Join(uploadDir, filename)
			if err := c.SaveUploadedFile(file, savePath); err != nil {
				fmt.Printf("Failed to save KTP file: %v\n", err)
			} else {
				ktpPath = "/uploads/ktp/" + filename
				fmt.Printf("KTP file saved successfully: %s\n", ktpPath)
			}
		}
	} else {
		fmt.Printf("No KTP file uploaded: %v\n", err)
	}

	// Insert ke database - properti_id akan NULL secara default
	fmt.Printf("Executing SQL INSERT...\n")
	result, err := db.Exec(`
		INSERT INTO penyewa (nama, nik, email, telepon, alamat, status_bayar, ktp_path) 
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		nama, nik, email, telepon, alamat, statusBayar, ktpPath,
	)
	if err != nil {
		fmt.Printf("Database INSERT error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	fmt.Printf("Penyewa created successfully with ID: %d\n", id)
	fmt.Printf("=== END DEBUG ===\n")
	
	c.JSON(http.StatusCreated, gin.H{
		"id": id, 
		"message": "Penyewa berhasil ditambahkan",
		"ktp_path": ktpPath,
	})
}

func updatePenyewa(c *gin.Context) {
	id := c.Param("id")
	
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		fmt.Printf("Failed to parse form: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form: " + err.Error()})
		return
	}

	nama := c.PostForm("nama")
	nik := c.PostForm("nik")
	email := c.PostForm("email")
	telepon := c.PostForm("telepon")
	alamat := c.PostForm("alamat")
	// Removed status_bayar from form - it will be calculated based on payment data

	// Validasi input wajib
	if nama == "" || telepon == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama dan telepon wajib diisi"})
		return
	}

	// Debug log
	fmt.Printf("=== UPDATE PENYEWA DEBUG (ID: %s) ===\n", id)
	fmt.Printf("Nama: '%s'\n", nama)
	fmt.Printf("NIK: '%s'\n", nik)
	fmt.Printf("Email: '%s'\n", email)
	fmt.Printf("Telepon: '%s'\n", telepon)
	fmt.Printf("Alamat: '%s'\n", alamat)

	// Handle KTP file upload
	file, err := c.FormFile("ktp")
	if err == nil {
		uploadDir := "./uploads/ktp"
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			fmt.Printf("Failed to create upload directory: %v\n", err)
		} else {
			filename := time.Now().Format("20060102150405") + filepath.Ext(file.Filename)
			savePath := filepath.Join(uploadDir, filename)
			if err := c.SaveUploadedFile(file, savePath); err != nil {
				fmt.Printf("Failed to save KTP file: %v\n", err)
			} else {
				ktpPath := "/uploads/ktp/" + filename
				fmt.Printf("KTP file updated: %s\n", ktpPath)
				db.Exec("UPDATE penyewa SET ktp_path=? WHERE id=?", ktpPath, id)
			}
		}
	} else {
		fmt.Printf("No new KTP file uploaded: %v\n", err)
	}

	// Update data penyewa - removed status_bayar from update
	fmt.Printf("Executing SQL UPDATE...\n")
	result, err := db.Exec(
		"UPDATE penyewa SET nama=?, nik=?, email=?, telepon=?, alamat=? WHERE id=?",
		nama, nik, email, telepon, alamat, id,
	)
	if err != nil {
		fmt.Printf("Database UPDATE error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("Rows affected: %d\n", rowsAffected)
	fmt.Printf("=== END DEBUG ===\n")

	c.JSON(http.StatusOK, gin.H{"message": "Penyewa updated successfully"})
}

func deletePenyewa(c *gin.Context) {
	id := c.Param("id")
	
	_, err := db.Exec("DELETE FROM penyewa WHERE id=?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Penyewa deleted successfully"})
}

// PEMBAYARAN HANDLERS
func createPembayaran(c *gin.Context) {
	fmt.Printf("=== CREATE PEMBAYARAN CALLED ===\n")
	
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		fmt.Printf("Failed to parse form: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form: " + err.Error()})
		return
	}

	penyewaID := c.PostForm("penyewa_id")
	propertiID := c.PostForm("properti_id")
	nominal := c.PostForm("harga_sewa")
	tanggalMulai := c.PostForm("tanggal_mulai")
	tanggalAkhir := c.PostForm("tanggal_akhir")
	metodeBayar := c.PostForm("metode_bayar")
	totalBiaya := c.PostForm("total_biaya")
	uangDibayar := c.PostForm("uang_dibayar")

	fmt.Printf("Form data received:\n")
	fmt.Printf("PenyewaID: %s\n", penyewaID)
	fmt.Printf("PropertiID: %s\n", propertiID)
	fmt.Printf("Nominal: %s\n", nominal)
	fmt.Printf("TotalBiaya: %s\n", totalBiaya)
	fmt.Printf("UangDibayar: %s\n", uangDibayar)
	fmt.Printf("TanggalMulai: %s\n", tanggalMulai)
	fmt.Printf("MetodeBayar: %s\n", metodeBayar)

	// Validasi input
	if penyewaID == "" || totalBiaya == "" || tanggalMulai == "" {
		fmt.Printf("Validation failed: missing required fields\n")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Penyewa, total biaya, dan tanggal mulai wajib diisi"})
		return
	}

	// Handle file upload
	var kwitansiPath string
	file, err := c.FormFile("kwitansi")
	if err == nil {
		fmt.Printf("File upload detected: %s\n", file.Filename)
		uploadDir := "./uploads/kwitansi"
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			fmt.Printf("Failed to create upload directory: %v\n", err)
		} else {
			filename := time.Now().Format("20060102150405") + filepath.Ext(file.Filename)
			savePath := filepath.Join(uploadDir, filename)
			if err := c.SaveUploadedFile(file, savePath); err != nil {
				fmt.Printf("Failed to save kwitansi file: %v\n", err)
			} else {
				kwitansiPath = "/uploads/kwitansi/" + filename
				fmt.Printf("File saved successfully: %s\n", kwitansiPath)
			}
		}
	} else {
		fmt.Printf("No file uploaded: %v\n", err)
	}

	// Convert date formats from ISO to MySQL format
	convertedTanggalMulai := convertDateFormat(tanggalMulai)
	convertedTanggalAkhir := convertDateFormat(tanggalAkhir)
	
	fmt.Printf("Converted TanggalMulai: %s -> %s\n", tanggalMulai, convertedTanggalMulai)
	fmt.Printf("Converted TanggalAkhir: %s -> %s\n", tanggalAkhir, convertedTanggalAkhir)

	// Insert pembayaran
	fmt.Printf("Inserting to database...\n")
	result, err := db.Exec(`
		INSERT INTO pembayaran (penyewa_id, nominal, uang_dibayar, tanggal_bayar, tanggal_mulai, tanggal_akhir, metode_bayar, kwitansi_path, status, keterangan) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
		penyewaID, totalBiaya, uangDibayar, convertedTanggalMulai, convertedTanggalMulai, convertedTanggalAkhir, metodeBayar, kwitansiPath, 
		fmt.Sprintf("Kontrak sewa dari %s sampai %s", convertedTanggalMulai, convertedTanggalAkhir),
	)
	if err != nil {
		fmt.Printf("Database insert error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	// Update properti status jika ada properti_id
	if propertiID != "" {
		fmt.Printf("Updating properti status for ID: %s\n", propertiID)
		db.Exec("UPDATE properti SET status='terisi' WHERE id=?", propertiID)
		// Update penyewa dengan properti_id dan tanggal kontrak
		db.Exec(`
			UPDATE penyewa SET 
				properti_id=?, 
				mulai_kontrak=?, 
				jatuh_tempo=DATE_ADD(?, INTERVAL 1 MONTH),
				status_bayar='lunas'
			WHERE id=?`, 
			propertiID, tanggalMulai, tanggalMulai, penyewaID,
		)
	}

	id, _ := result.LastInsertId()
	fmt.Printf("Pembayaran created successfully with ID: %d\n", id)
	fmt.Printf("=== END CREATE PEMBAYARAN ===\n")
	
	c.JSON(http.StatusCreated, gin.H{
		"id": id,
		"message": "Kontrak berhasil dibuat",
		"kwitansi_path": kwitansiPath,
	})
}

func updatePembayaran(c *gin.Context) {
	id := c.Param("id")
	fmt.Printf("=== UPDATE PEMBAYARAN ID: %s ===\n", id)
	
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		fmt.Printf("Failed to parse form: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form: " + err.Error()})
		return
	}

	penyewaID := c.PostForm("penyewa_id")
	propertiID := c.PostForm("properti_id")
	totalBiaya := c.PostForm("total_biaya")
	uangDibayar := c.PostForm("uang_dibayar")
	tanggalMulai := c.PostForm("tanggal_mulai")
	tanggalAkhir := c.PostForm("tanggal_akhir")
	metodeBayar := c.PostForm("metode_bayar")
	status := c.PostForm("status")
	if status == "" {
		status = "pending"
	}

	fmt.Printf("Update data received:\n")
	fmt.Printf("PenyewaID: %s\n", penyewaID)
	fmt.Printf("PropertiID: %s\n", propertiID)
	fmt.Printf("TotalBiaya: %s\n", totalBiaya)
	fmt.Printf("UangDibayar: %s\n", uangDibayar)
	fmt.Printf("TanggalMulai: %s\n", tanggalMulai)
	fmt.Printf("TanggalAkhir: %s\n", tanggalAkhir)
	fmt.Printf("MetodeBayar: %s\n", metodeBayar)
	fmt.Printf("Status: %s\n", status)

	// Handle file upload
	file, err := c.FormFile("kwitansi")
	if err == nil {
		fmt.Printf("File upload detected: %s\n", file.Filename)
		uploadDir := "./uploads/kwitansi"
		if err := os.MkdirAll(uploadDir, os.ModePerm); err == nil {
			filename := time.Now().Format("20060102150405") + filepath.Ext(file.Filename)
			savePath := filepath.Join(uploadDir, filename)
			if err := c.SaveUploadedFile(file, savePath); err == nil {
				kwitansiPath := "/uploads/kwitansi/" + filename
				fmt.Printf("File saved: %s\n", kwitansiPath)
				db.Exec("UPDATE pembayaran SET kwitansi_path=? WHERE id=?", kwitansiPath, id)
			}
		}
	} else {
		fmt.Printf("No file uploaded: %v\n", err)
	}

	// Convert date formats from ISO to MySQL format
	convertedTanggalMulai := convertDateFormat(tanggalMulai)
	convertedTanggalAkhir := convertDateFormat(tanggalAkhir)
	
	fmt.Printf("Converted TanggalMulai: %s -> %s\n", tanggalMulai, convertedTanggalMulai)
	fmt.Printf("Converted TanggalAkhir: %s -> %s\n", tanggalAkhir, convertedTanggalAkhir)

	// Update pembayaran
	fmt.Printf("Updating pembayaran in database...\n")
	_, err = db.Exec(`
		UPDATE pembayaran SET 
			penyewa_id=?, nominal=?, uang_dibayar=?, tanggal_bayar=?, tanggal_mulai=?, tanggal_akhir=?, 
			metode_bayar=?, status=?, updated_at=CURRENT_TIMESTAMP 
		WHERE id=?`,
		penyewaID, totalBiaya, uangDibayar, convertedTanggalMulai, convertedTanggalMulai, convertedTanggalAkhir, metodeBayar, status, id,
	)
	if err != nil {
		fmt.Printf("Database UPDATE error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	// Update properti status jika ada properti_id
	if propertiID != "" {
		fmt.Printf("Updating properti status for ID: %s\n", propertiID)
		db.Exec("UPDATE properti SET status='terisi' WHERE id=?", propertiID)
		// Update penyewa dengan properti_id dan tanggal kontrak
		db.Exec(`
			UPDATE penyewa SET 
				properti_id=?, 
				mulai_kontrak=?, 
				jatuh_tempo=DATE_ADD(?, INTERVAL 1 MONTH),
				status_bayar='lunas'
			WHERE id=?`, 
			propertiID, convertedTanggalMulai, convertedTanggalMulai, penyewaID,
		)
	}

	fmt.Printf("Pembayaran updated successfully\n")
	fmt.Printf("=== END UPDATE PEMBAYARAN ===\n")

	c.JSON(http.StatusOK, gin.H{"message": "Pembayaran berhasil diupdate"})
}

func deletePembayaran(c *gin.Context) {
	id := c.Param("id")
	
	_, err := db.Exec("DELETE FROM pembayaran WHERE id=?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pembayaran berhasil dihapus"})
}

func uploadKwitansi(c *gin.Context) {
	file, err := c.FormFile("kwitansi")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File tidak ditemukan"})
		return
	}

	uploadDir := "./uploads/kwitansi"
	os.MkdirAll(uploadDir, os.ModePerm)

	filename := time.Now().Format("20060102150405") + filepath.Ext(file.Filename)
	filepath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Upload berhasil",
		"filename": filename,
		"path":     "/uploads/kwitansi/" + filename,
	})
}

func getPembayaran(c *gin.Context) {
	rows, err := db.Query(`
		SELECT p.id, p.penyewa_id, COALESCE(py.nama, 'Unknown') as nama_penyewa, 
		       COALESCE(py.nik, '') as nik, COALESCE(py.email, '') as email,
		       COALESCE(py.telepon, '') as telepon, COALESCE(py.alamat, '') as alamat,
		       COALESCE(py.ktp_path, '') as ktp_path,
		       COALESCE(py.properti_id, 0) as properti_id,
		       p.nominal, COALESCE(p.uang_dibayar, p.nominal) as uang_dibayar, p.tanggal_bayar, 
		       COALESCE(p.tanggal_mulai, p.tanggal_bayar) as tanggal_mulai,
		       p.tanggal_akhir,
		       p.metode_bayar, 
		       COALESCE(p.kwitansi_path, '') as kwitansi_path, 
		       p.status, COALESCE(p.keterangan, '') as keterangan
		FROM pembayaran p
		LEFT JOIN penyewa py ON p.penyewa_id = py.id
		ORDER BY p.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusOK, []map[string]interface{}{})
		return
	}
	defer rows.Close()

	var pembayaranList []map[string]interface{}
	for rows.Next() {
		var pb struct {
			ID           int     `json:"id"`
			PenyewaID    int     `json:"penyewa_id"`
			NamaPenyewa  string  `json:"nama_penyewa"`
			NIK          string  `json:"nik"`
			Email        string  `json:"email"`
			Telepon      string  `json:"telepon"`
			Alamat       string  `json:"alamat"`
			KtpPath      string  `json:"ktp_path"`
			PropertiID   int     `json:"properti_id"`
			Nominal      float64 `json:"nominal"`
			UangDibayar  float64 `json:"uang_dibayar"`
			TanggalBayar string  `json:"tanggal_bayar"`
			TanggalMulai string  `json:"tanggal_mulai"`
			TanggalAkhir *string `json:"tanggal_akhir"`
			MetodeBayar  string  `json:"metode_bayar"`
			KwitansiPath string  `json:"kwitansi_path"`
			Status       string  `json:"status"`
			Keterangan   string  `json:"keterangan"`
		}
		
		if err := rows.Scan(&pb.ID, &pb.PenyewaID, &pb.NamaPenyewa, &pb.NIK, &pb.Email, &pb.Telepon, &pb.Alamat, &pb.KtpPath, &pb.PropertiID, &pb.Nominal, &pb.UangDibayar, &pb.TanggalBayar, &pb.TanggalMulai, &pb.TanggalAkhir, &pb.MetodeBayar, &pb.KwitansiPath, &pb.Status, &pb.Keterangan); err != nil {
			fmt.Printf("Error scanning row: %v\n", err)
			continue
		}
		
		// Debug log untuk melihat data penyewa
		fmt.Printf("=== DEBUG PEMBAYARAN ID: %d ===\n", pb.ID)
		fmt.Printf("Penyewa ID: %d\n", pb.PenyewaID)
		fmt.Printf("Properti ID: %d\n", pb.PropertiID)
		fmt.Printf("Nama: %s\n", pb.NamaPenyewa)
		fmt.Printf("NIK: %s\n", pb.NIK)
		fmt.Printf("Email: %s\n", pb.Email)
		fmt.Printf("Telepon: %s\n", pb.Telepon)
		fmt.Printf("Alamat: %s\n", pb.Alamat)
		fmt.Printf("KTP Path: %s\n", pb.KtpPath)
		fmt.Printf("=== END DEBUG ===\n")
		
		// Convert to map untuk fleksibilitas
		item := map[string]interface{}{
			"id":            pb.ID,
			"penyewa_id":    pb.PenyewaID,
			"properti_id":   pb.PropertiID,
			"nama_penyewa":  pb.NamaPenyewa,
			"nik":           pb.NIK,
			"email":         pb.Email,
			"telepon":       pb.Telepon,
			"alamat":        pb.Alamat,
			"ktp_path":      pb.KtpPath,
			"nominal":       pb.Nominal,
			"uang_dibayar":  pb.UangDibayar,
			"tanggal_bayar": pb.TanggalBayar,
			"tanggal_mulai": pb.TanggalMulai,
			"tanggal_akhir": nil,
			"metode_bayar":  pb.MetodeBayar,
			"kwitansi_path": pb.KwitansiPath,
			"status":        pb.Status,
			"keterangan":    pb.Keterangan,
		}
		
		if pb.TanggalAkhir != nil {
			item["tanggal_akhir"] = *pb.TanggalAkhir
		}
		
		pembayaranList = append(pembayaranList, item)
	}

	c.JSON(http.StatusOK, pembayaranList)
}

// Get riwayat pembayaran untuk detail
func getRiwayatPembayaran(c *gin.Context) {
	pembayaranID := c.Param("id")
	
	fmt.Printf("=== GET RIWAYAT PEMBAYARAN ID: %s ===\n", pembayaranID)
	
	rows, err := db.Query(`
		SELECT id, jumlah_dibayar, tanggal_bayar, metode_bayar, 
		       COALESCE(kwitansi_path, '') as kwitansi_path, 
		       COALESCE(keterangan, '') as keterangan
		FROM riwayat_pembayaran 
		WHERE pembayaran_id = ? 
		ORDER BY tanggal_bayar ASC
	`, pembayaranID)
	
	if err != nil {
		fmt.Printf("Error querying riwayat: %v\n", err)
		c.JSON(http.StatusOK, []map[string]interface{}{})
		return
	}
	defer rows.Close()

	var riwayatList []map[string]interface{}
	totalDibayar := 0.0
	
	for rows.Next() {
		var riwayat struct {
			ID           int     `json:"id"`
			JumlahDibayar float64 `json:"jumlah_dibayar"`
			TanggalBayar string  `json:"tanggal_bayar"`
			MetodeBayar  string  `json:"metode_bayar"`
			KwitansiPath string  `json:"kwitansi_path"`
			Keterangan   string  `json:"keterangan"`
		}
		
		if err := rows.Scan(&riwayat.ID, &riwayat.JumlahDibayar, &riwayat.TanggalBayar, &riwayat.MetodeBayar, &riwayat.KwitansiPath, &riwayat.Keterangan); err != nil {
			fmt.Printf("Error scanning riwayat row: %v\n", err)
			continue
		}
		
		totalDibayar += riwayat.JumlahDibayar
		
		item := map[string]interface{}{
			"id":             riwayat.ID,
			"jumlah_dibayar": riwayat.JumlahDibayar,
			"tanggal_bayar":  riwayat.TanggalBayar,
			"metode_bayar":   riwayat.MetodeBayar,
			"kwitansi_path":  riwayat.KwitansiPath,
			"keterangan":     riwayat.Keterangan,
			"total_sampai_sini": totalDibayar,
		}
		
		riwayatList = append(riwayatList, item)
		
		fmt.Printf("Riwayat #%d: Rp %.2f, Total: Rp %.2f\n", len(riwayatList), riwayat.JumlahDibayar, totalDibayar)
	}
	
	fmt.Printf("Total riwayat found: %d\n", len(riwayatList))
	fmt.Printf("=== END GET RIWAYAT ===\n")
	
	c.JSON(http.StatusOK, riwayatList)
}

// Add riwayat pembayaran
func addRiwayatPembayaran(c *gin.Context) {
	pembayaranID := c.Param("id")
	
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	jumlahDibayar := c.PostForm("jumlah_dibayar")
	metodeBayar := c.PostForm("metode_bayar")
	keterangan := c.PostForm("keterangan")

	fmt.Printf("=== ADD RIWAYAT PEMBAYARAN ID: %s ===\n", pembayaranID)
	fmt.Printf("Jumlah: %s, Metode: %s\n", jumlahDibayar, metodeBayar)

	// Handle file upload
	var kwitansiPath string
	file, err := c.FormFile("kwitansi")
	if err == nil {
		uploadDir := "./uploads/kwitansi"
		if err := os.MkdirAll(uploadDir, os.ModePerm); err == nil {
			filename := time.Now().Format("20060102150405") + filepath.Ext(file.Filename)
			savePath := filepath.Join(uploadDir, filename)
			if err := c.SaveUploadedFile(file, savePath); err == nil {
				kwitansiPath = "/uploads/kwitansi/" + filename
				fmt.Printf("Kwitansi saved: %s\n", kwitansiPath)
			}
		}
	}

	// Insert riwayat pembayaran
	_, err = db.Exec(`
		INSERT INTO riwayat_pembayaran (pembayaran_id, jumlah_dibayar, metode_bayar, kwitansi_path, keterangan) 
		VALUES (?, ?, ?, ?, ?)`,
		pembayaranID, jumlahDibayar, metodeBayar, kwitansiPath, keterangan,
	)
	if err != nil {
		fmt.Printf("Error inserting riwayat: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	fmt.Printf("Riwayat pembayaran added successfully\n")
	c.JSON(http.StatusCreated, gin.H{"message": "Riwayat pembayaran berhasil ditambahkan"})
}

func createRiwayatTable(c *gin.Context) {
	// Create riwayat_pembayaran table if it doesn't exist
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS riwayat_pembayaran (
		id INT AUTO_INCREMENT PRIMARY KEY,
		pembayaran_id INT NOT NULL,
		jumlah_dibayar DECIMAL(12,2) NOT NULL,
		tanggal_bayar DATETIME DEFAULT CURRENT_TIMESTAMP,
		metode_bayar VARCHAR(50) DEFAULT 'Transfer',
		kwitansi_path VARCHAR(255) NULL,
		keterangan TEXT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		
		FOREIGN KEY (pembayaran_id) REFERENCES pembayaran(id) ON DELETE CASCADE ON UPDATE CASCADE,
		
		INDEX idx_pembayaran_id (pembayaran_id),
		INDEX idx_tanggal_bayar (tanggal_bayar)
	);`
	
	_, err := db.Exec(createTableSQL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create table: " + err.Error()})
		return
	}
	
	// Migrate existing data
	migrateSQL := `
	INSERT IGNORE INTO riwayat_pembayaran (pembayaran_id, jumlah_dibayar, tanggal_bayar, metode_bayar, kwitansi_path, keterangan)
	SELECT 
		id as pembayaran_id,
		COALESCE(uang_dibayar, nominal) as jumlah_dibayar,
		tanggal_bayar,
		metode_bayar,
		kwitansi_path,
		'Pembayaran awal'
	FROM pembayaran
	WHERE id NOT IN (SELECT DISTINCT pembayaran_id FROM riwayat_pembayaran);`
	
	_, err = db.Exec(migrateSQL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to migrate data: " + err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Table riwayat_pembayaran created and data migrated successfully"})
}

// AUTH HANDLERS
func login(c *gin.Context) {
	var loginData struct {
		Nama     string `json:"nama"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data login tidak valid"})
		return
	}

	fmt.Printf("=== LOGIN ATTEMPT ===\n")
	fmt.Printf("Nama: %s\n", loginData.Nama)
	fmt.Printf("Password: %s\n", loginData.Password)

	// Hardcoded credentials
	validUsers := map[string]string{
		"mamah": "123",
		"admin": "321",
		"demo":  "demo123",
	}

	if password, exists := validUsers[loginData.Nama]; exists && password == loginData.Password {
		fmt.Printf("Login successful for user: %s\n", loginData.Nama)
		
		// Determine user role
		var role string
		if loginData.Nama == "demo" {
			role = "demo"
		} else {
			role = "admin"
		}
		
		user := map[string]interface{}{
			"nama": loginData.Nama,
			"role": role,
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Login berhasil",
			"user":    user,
		})
	} else {
		fmt.Printf("Login failed for user: %s\n", loginData.Nama)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Nama pengguna atau password salah",
		})
	}
}

func logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logout berhasil",
	})
}
