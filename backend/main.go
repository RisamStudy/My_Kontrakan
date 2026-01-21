package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq" // PostgreSQL driver
	"github.com/joho/godotenv"
)

var db *sql.DB

func createRiwayatPembayaranTable() {
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
		
		-- Foreign key
		FOREIGN KEY (pembayaran_id) REFERENCES pembayaran(id) ON DELETE CASCADE ON UPDATE CASCADE,
		
		-- Index untuk performa
		INDEX idx_pembayaran_id (pembayaran_id),
		INDEX idx_tanggal_bayar (tanggal_bayar)
	);`
	
	_, err := db.Exec(createTableSQL)
	if err != nil {
		log.Printf("Error creating riwayat_pembayaran table: %v", err)
	} else {
		log.Printf("Table riwayat_pembayaran created or already exists")
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
		log.Printf("Error migrating existing data: %v", err)
	} else {
		log.Printf("Existing payment data migrated to riwayat_pembayaran")
	}
}

func main() {
	// Load .env file hanya untuk development
	godotenv.Load()

	var err error
	var dsn string
	var dbDriver string
	
	// Cek apakah menggunakan DATABASE_URL (PostgreSQL di Render) atau MySQL lokal
	if databaseURL := os.Getenv("DATABASE_URL"); databaseURL != "" {
		// PostgreSQL (Render)
		dsn = databaseURL
		dbDriver = "postgres"
		log.Printf("Using PostgreSQL (Render)")
	} else {
		// MySQL (Development) - gunakan environment variables terpisah
		dbHost := os.Getenv("DB_HOST")
		dbPort := os.Getenv("DB_PORT")
		dbUser := os.Getenv("DB_USER")
		dbPassword := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")
		
		if dbHost == "" {
			dbHost = "localhost"
		}
		if dbPort == "" {
			dbPort = "3306"
		}
		if dbUser == "" {
			dbUser = "root"
		}
		if dbName == "" {
			dbName = "kontrakanku"
		}
		
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", 
			dbUser, dbPassword, dbHost, dbPort, dbName)
		dbDriver = "mysql"
		log.Printf("Using MySQL (Development)")
	}
	
	log.Printf("Connecting to database...")
	db, err = sql.Open(dbDriver, dsn)
	if err != nil {
		log.Fatal("Database connection failed:", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatal("Database ping failed:", err)
	}
	log.Printf("Database connected successfully!")

	// Create riwayat_pembayaran table
	createRiwayatPembayaranTable()

	// Set Gin mode
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()
	r.Use(corsMiddleware())
	
	// Serve static files
	r.Static("/uploads", "./uploads")

	api := r.Group("/api")
	{
		api.GET("/dashboard/stats", getDashboardStats)
		
		// Auth routes
		api.POST("/auth/login", login)
		api.POST("/auth/logout", logout)
		
		// Pembayaran routes - tambahkan middleware untuk operasi CRUD
		api.GET("/pembayaran", getPembayaran)
		api.POST("/pembayaran", checkDemoUser(), createPembayaran)
		api.PUT("/pembayaran/:id", checkDemoUser(), updatePembayaran)
		api.DELETE("/pembayaran/:id", checkDemoUser(), deletePembayaran)
		api.POST("/pembayaran/upload", checkDemoUser(), uploadKwitansi)
		api.GET("/pembayaran/:id/riwayat", getRiwayatPembayaran)
		api.POST("/pembayaran/:id/riwayat", checkDemoUser(), addRiwayatPembayaran)
		api.POST("/create-riwayat-table", createRiwayatTable)
		
		// Penyewa routes - tambahkan middleware untuk operasi CRUD
		api.GET("/penyewa", getPenyewa)
		api.POST("/penyewa", checkDemoUser(), createPenyewa)
		api.PUT("/penyewa/:id", checkDemoUser(), updatePenyewa)
		api.DELETE("/penyewa/:id", checkDemoUser(), deletePenyewa)
		
		// Properti routes - tambahkan middleware untuk operasi CRUD
		api.GET("/properti", getProperti)
		api.POST("/properti", checkDemoUser(), createProperti)
		api.PUT("/properti/:id", checkDemoUser(), updateProperti)
		api.DELETE("/properti/:id", checkDemoUser(), deleteProperti)
	}

	log.Printf("Routes registered:")
	log.Printf("- POST /api/pembayaran -> createPembayaran")
	log.Printf("- GET /api/pembayaran -> getPembayaran")
	log.Printf("- PUT /api/pembayaran/:id -> updatePembayaran")
	log.Printf("- DELETE /api/pembayaran/:id -> deletePembayaran")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on port %s", port)
	r.Run(":" + port)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// Daftar origin yang diizinkan
		allowedOrigins := []string{
			"http://localhost:5173",  // Development
			"http://localhost:3000",  // Development alternatif
			"https://kontrakanku.vercel.app", // Production Vercel (ganti dengan domain Anda)
		}
		
		// Cek apakah origin diizinkan
		isAllowed := false
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				isAllowed = true
				break
			}
		}
		
		if isAllowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Role")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
