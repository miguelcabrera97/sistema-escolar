'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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