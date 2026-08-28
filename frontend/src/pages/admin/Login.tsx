import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { loginAdmin, registerAdmin, getAdminProfile } from '@/api'
import { ArrowLeft } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Nama wajib diisi'),
})

export default function Login() {
  const navigate = useNavigate()
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  
  const form = useForm({
    resolver: zodResolver(isRegistering ? registerSchema : loginSchema),
    defaultValues: { email: '', password: '', name: '' }
  })

  useEffect(() => {
    getAdminProfile().then(() => navigate('/admin')).catch(() => {})
  }, [navigate])

  const onSubmit = async (values: any) => {
    setError('')
    try {
      if (isRegistering) {
        await registerAdmin({ email: values.email, password: values.password, name: values.name })
        alert("Admin berhasil dibuat! Silakan login.")
        setIsRegistering(false)
        form.reset()
      } else {
        await loginAdmin({ email: values.email, password: values.password })
        navigate('/admin')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] p-4 relative font-sans overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full border-[1px] border-amber-600/20 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] rounded-full border-[1px] border-amber-600/10 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <button 
        className="absolute top-6 left-6 md:top-8 md:left-8 text-slate-400 hover:text-amber-500 transition-colors flex items-center text-sm font-medium z-20"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Beranda
      </button>

      <div className="w-full max-w-md bg-[#0a192f] rounded-2xl shadow-2xl border border-gray-800 overflow-hidden relative z-10">
        
        {/* Top Gold Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700" />
        
        <div className="p-8 md:p-10">
          <div className="space-y-3 text-center mb-10">
            <div className="flex justify-center mb-6">
              <img 
                src="/logo-light.png" 
                alt="Nawasena Holding" 
                className="h-16 object-contain"
                onError={(e) => {
                  const target = e.currentTarget
                  if (target.src.includes('.png')) {
                    target.src = target.src.replace('.png', '.jpg')
                  } else if (target.src.includes('.jpg')) {
                    target.src = target.src.replace('.jpg', '.jpeg')
                  } else {
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }
                }} 
              />
              <span className="hidden text-3xl font-bold tracking-tight text-white">
                NAWASENA <span className="text-amber-500">HOLDING</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
            <p className="text-slate-400 text-sm">
              {isRegistering ? 'Buat akun administrator sistem.' : 'Login untuk mengakses panel manajemen.'}
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20 text-center font-medium">
              {error}
            </div>
          )}
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {isRegistering && (
              <div className="space-y-1">
                <input 
                  placeholder="Nama Lengkap" 
                  {...form.register('name')} 
                  className="w-full bg-[#0d1326] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
                />
                {form.formState.errors.name && <p className="text-xs text-red-400 ml-1 mt-1">{form.formState.errors.name.message as string}</p>}
              </div>
            )}
            <div className="space-y-1">
              <input 
                placeholder="Alamat Email" 
                type="email" 
                {...form.register('email')} 
                className="w-full bg-[#0d1326] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
              />
              {form.formState.errors.email && <p className="text-xs text-red-400 ml-1 mt-1">{form.formState.errors.email.message as string}</p>}
            </div>
            <div className="space-y-1">
              <input 
                placeholder="Password" 
                type="password" 
                {...form.register('password')} 
                className="w-full bg-[#0d1326] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
              />
              {form.formState.errors.password && <p className="text-xs text-red-400 ml-1 mt-1">{form.formState.errors.password.message as string}</p>}
            </div>
            
            <button 
              type="submit" 
              disabled={form.formState.isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 text-[#0a192f] font-bold py-3 px-4 rounded-lg transition-colors mt-2"
            >
              {form.formState.isSubmitting ? 'Memproses...' : (isRegistering ? 'Daftar Admin' : 'Masuk ke Sistem')}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
