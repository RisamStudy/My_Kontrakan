# KontrakanKu

Aplikasi manajemen kontrakan dengan fitur upload kwitansi pembayaran.

## Tech Stack

- **Frontend**: React (Joko UI) - Hosted di Vercel
- **Backend**: Go (Prabogo) - Hosted di Render
- **Database**: MySQL - Hosted di Render
- **Platform**: Web & Mobile (WebView/APK)

## Fitur Utama

- Dashboard manajemen kontrakan
- Manajemen properti dan unit
- Manajemen penyewa
- Upload foto kwitansi pembayaran
- Notifikasi WhatsApp & Email
- Tracking pembayaran dan jatuh tempo

## Struktur Project

```
kontrakanku/
├── frontend/          # React application
├── backend/           # Go API server
└── README.md
```

## Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
go mod download
go run main.go
```

## Deployment

- Frontend: Vercel (auto-deploy dari Git)
- Backend + MySQL: Render (free tier)
