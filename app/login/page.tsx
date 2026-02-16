'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Sistema Escolar</CardTitle>
          <CardDescription>
            Inicia sesión para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorParam && (
            <Alert variant="destructive" className="mb-4 text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorParam === 'auth-code-error' && "El enlace de recuperación es inválido o ha expirado."}
                {errorParam === 'auth-callback-error' && "Error al verificar el enlace de recuperación."}
                {errorParam !== 'auth-code-error' && errorParam !== 'auth-callback-error' && errorParam}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="password">Contraseña</Label>
                <button
                  type="button"
                  onClick={() => router.push('/recuperar-password')}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
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