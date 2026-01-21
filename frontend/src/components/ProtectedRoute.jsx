import { useEffect } from 'react'

function ProtectedRoute({ children }) {
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const user = localStorage.getItem('user')
    
    if (!isLoggedIn || !user) {
      window.location.href = '/login'
    }
  }, [])

  const isLoggedIn = localStorage.getItem('isLoggedIn')
  const user = localStorage.getItem('user')
  
  if (!isLoggedIn || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute