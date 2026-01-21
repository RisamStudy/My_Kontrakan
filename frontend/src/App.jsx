import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Properti from './pages/Properti'
import Penyewa from './pages/Penyewa'
import Pembayaran from './pages/Pembayaran'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="properti" element={<Properti />} />
          <Route path="penyewa" element={<Penyewa />} />
          <Route path="pembayaran" element={<Pembayaran />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
