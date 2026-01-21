import { createClient } from '@supabase/supabase-js'

// Konfigurasi Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: Log environment variables
console.log('🔧 Supabase Config:')
console.log('URL:', supabaseUrl)
console.log('API Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
} else {
  console.log('✅ Supabase environment variables loaded')
}

// Buat Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'kontrakanku-web'
    }
  }
})

// Helper functions untuk database operations
export const db = {
  // PROPERTI
  properti: {
    getAll: () => supabase.from('properti').select('*').order('id', { ascending: false }),
    
    getById: (id) => supabase.from('properti').select('*').eq('id', id).single(),
    
    create: (data) => supabase.from('properti').insert(data).select().single(),
    
    update: (id, data) => supabase.from('properti').update(data).eq('id', id).select().single(),
    
    delete: (id) => supabase.from('properti').delete().eq('id', id)
  },

  // PENYEWA
  penyewa: {
    getAll: () => supabase
      .from('penyewa')
      .select(`
        *,
        properti:properti_id(nama_unit, foto_path),
        pembayaran(nominal, uang_dibayar)
      `)
      .order('id', { ascending: false }),
    
    getById: (id) => supabase.from('penyewa').select('*').eq('id', id).single(),
    
    create: (data) => supabase.from('penyewa').insert(data).select().single(),
    
    update: (id, data) => supabase.from('penyewa').update(data).eq('id', id).select().single(),
    
    delete: (id) => supabase.from('penyewa').delete().eq('id', id)
  },

  // PEMBAYARAN
  pembayaran: {
    getAll: () => supabase
      .from('pembayaran')
      .select(`
        *,
        penyewa(nama, nik, email, telepon, alamat, ktp_path, properti_id)
      `)
      .order('created_at', { ascending: false }),
    
    getById: (id) => supabase.from('pembayaran').select('*').eq('id', id).single(),
    
    create: (data) => supabase.from('pembayaran').insert(data).select().single(),
    
    update: (id, data) => supabase.from('pembayaran').update(data).eq('id', id).select().single(),
    
    delete: (id) => supabase.from('pembayaran').delete().eq('id', id),

    // Riwayat pembayaran
    getRiwayat: (pembayaranId) => supabase
      .from('riwayat_pembayaran')
      .select('*')
      .eq('pembayaran_id', pembayaranId)
      .order('tanggal_bayar', { ascending: true }),
    
    addRiwayat: (data) => supabase.from('riwayat_pembayaran').insert(data).select().single()
  },

  // ADMIN
  admin: {
    getByEmail: (email) => supabase.from('admin').select('*').eq('email', email).single(),
    
    getByNama: (nama) => supabase.from('admin').select('*').eq('nama', nama).single()
  },

  // DASHBOARD STATS
  stats: {
    getDashboard: async () => {
      try {
        // Total pendapatan
        const { data: pembayaranData } = await supabase
          .from('pembayaran')
          .select('uang_dibayar, nominal')
        
        const totalPendapatan = pembayaranData?.reduce((sum, item) => {
          return sum + (parseFloat(item.uang_dibayar) || parseFloat(item.nominal) || 0)
        }, 0) || 0

        // Unit terisi
        const { count: unitTerisi } = await supabase
          .from('properti')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'terisi')

        // Total unit
        const { count: totalUnit } = await supabase
          .from('properti')
          .select('*', { count: 'exact', head: true })

        // Jatuh tempo (7 hari ke depan)
        const today = new Date()
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        const { count: jatuhTempo } = await supabase
          .from('pembayaran')
          .select('*', { count: 'exact', head: true })
          .gte('tanggal_akhir', today.toISOString().split('T')[0])
          .lte('tanggal_akhir', nextWeek.toISOString().split('T')[0])

        return {
          totalPendapatan: totalPendapatan,
          unitTerisi: unitTerisi || 0,
          totalUnit: totalUnit || 0,
          jatuhTempo: jatuhTempo || 0
        }
      } catch (error) {
        console.error('Error getting dashboard stats:', error)
        return {
          totalPendapatan: 0,
          unitTerisi: 0,
          totalUnit: 0,
          jatuhTempo: 0
        }
      }
    }
  }
}

// Helper functions untuk file upload
export const storage = {
  // Upload file ke bucket
  upload: async (bucket, path, file) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  },

  // Get public URL
  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  },

  // Delete file
  delete: async (bucket, paths) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(paths)
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }
}

// Authentication helpers (untuk login manual)
export const auth = {
  // Login dengan email/password (jika mau pakai Supabase Auth)
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Logout
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }
}

export default supabase