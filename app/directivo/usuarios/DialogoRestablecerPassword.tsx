'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Key, Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react'
import { restablecerPasswordUsuario } from '@/app/actions/usuarios-actions'

export interface UsuarioGenerico {
    id?: string
    user_id: string
    nombre?: string
    apellidos?: string
    email?: string
    profiles?: {
        nombre: string
        apellidos: string
        email?: string
    }
}

interface Props {
    usuario: UsuarioGenerico | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function DialogoRestablecerPassword({ usuario, open, onOpenChange, onSuccess }: Props) {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const generarPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let pass = ''
        for (let i = 0; i < 8; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setPassword(pass)
        setShowPassword(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!usuario || !password.trim()) return

        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setLoading(true)
        try {
            // Usar la acción genérica
            const result = await restablecerPasswordUsuario(usuario.user_id, password)

            if (result.success) {
                alert(result.message)
                onOpenChange(false)
                onSuccess()
                setPassword('')
            } else {
                alert('Error: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('Error al restablecer la contraseña')
        } finally {
            setLoading(false)
        }
    }

    if (!usuario) return null

    // Resolver nombre y apellidos (soportando estructura plana o anidada en profiles)
    const nombre = usuario.nombre || usuario.profiles?.nombre || ''
    const apellidos = usuario.apellidos || usuario.profiles?.apellidos || ''

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Restablecer Contraseña
                    </DialogTitle>
                    <DialogDescription>
                        Cambiar la contraseña para el usuario <strong>{nombre} {apellidos}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Nueva Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generarPassword}
                            className="w-full"
                        >
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Generar Aleatoria
                        </Button>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || password.length < 6}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Guardar Nueva Contraseña
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
