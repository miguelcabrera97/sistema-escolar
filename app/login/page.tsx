'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Handle implicit flow (hash fragment)
  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        // Extract params from hash
        const params = new URLSearchParams(hash.substring(1)) // remove #
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        if (accessToken && type === 'recovery') {
          setLoading(true)
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (!error) {
            router.push('/restablecer-password')
          } else {
            alert('Error al procesar el enlace de recuperación.')
            setLoading(false)
          }
        }
      }
    }

    handleHash()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileData) {
          switch (profileData.role) {
            case 'alumno':
              router.push('/alumno')
              break
            case 'maestro':
              router.push('/maestro')
              break
            case 'padre':
              router.push('/padre')
              break
            case 'directivo':
              router.push('/directivo')
              break
            case 'auxiliar_calificaciones':
              router.push('/auxiliar')
              break
            default:
              alert('Rol no reconocido')
          }
        }
      }
    } catch (err) {
      const error = err as Error
      alert('Error al iniciar sesión: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#29476b]/5 via-white to-[#29476b]/10 px-4">
      <Card className="w-full max-w-md border-0 shadow-2xl shadow-[#29476b]/20 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <div className="h-2 w-full bg-[#29476b]"></div>
        <CardHeader className="text-center pt-8 pb-4">
          <div className="flex justify-center mb-6">
            <div className="relative h-24 w-24 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 p-2">
              <Image
                src="/logo.png"
                alt="Logo Sistema Escolar"
                fill
                className="object-contain p-2"
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Bienvenido
          </CardTitle>
          <CardDescription className="text-base mt-2 text-gray-500">
            Ingresa a tu cuenta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          {errorParam && (
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 text-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                {errorParam === 'auth-code-error' && "El enlace de recuperación es inválido o ha expirado."}
                {errorParam === 'auth-callback-error' && "Error al verificar el enlace de recuperación."}
                {errorParam !== 'auth-code-error' && errorParam !== 'auth-callback-error' && errorParam}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                required
                disabled={loading}
                className="h-12 px-4 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#29476b]/20 focus:border-[#29476b] transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <button
                  type="button"
                  onClick={() => router.push('/recuperar-password')}
                  className="text-sm font-medium text-[#29476b] hover:text-[#1c314b] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="h-12 px-4 pr-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#29476b]/20 focus:border-[#29476b] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#29476b] transition-colors p-2 rounded-full hover:bg-gray-100"
                  disabled={loading}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 mt-2 text-base font-medium rounded-xl bg-[#29476b] hover:bg-[#1c314b] text-white shadow-lg shadow-[#29476b]/30 transition-all duration-300 transform hover:-translate-y-0.5" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}