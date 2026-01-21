// Authentication and authorization utilities

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

export const getUserRole = () => {
  const user = getCurrentUser()
  return user?.role || 'guest'
}

export const isAdmin = () => {
  const role = getUserRole()
  return role === 'admin'
}

export const isDemo = () => {
  const role = getUserRole()
  return role === 'demo'
}

export const canCreate = () => {
  return isAdmin()
}

export const canEdit = () => {
  return isAdmin()
}

export const canDelete = () => {
  return isAdmin()
}

export const canView = () => {
  // Both admin and demo can view
  const role = getUserRole()
  return role === 'admin' || role === 'demo'
}

export const getRoleDisplayName = () => {
  const role = getUserRole()
  const roleNames = {
    admin: 'Administrator',
    demo: 'Pengguna Demo (Hanya Baca)',
    guest: 'Tamu'
  }
  return roleNames[role] || 'Tidak Dikenal'
}