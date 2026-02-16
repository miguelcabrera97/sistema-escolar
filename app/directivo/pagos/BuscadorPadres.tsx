'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X, Check, User } from 'lucide-react'

// Definimos el tipo compatible con la estructura de padres en el diálogo
export interface PadreBuscador {
    id: string
    profiles: {
        nombre: string
        apellidos: string
        email: string
    }
}

interface BuscadorPadresProps {
    padres: PadreBuscador[]
    onSeleccionar: (id: string) => void
    seleccionadoId?: string
}

export function BuscadorPadres({ padres, onSeleccionar, seleccionadoId }: BuscadorPadresProps) {
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [padreSeleccionado, setPadreSeleccionado] = useState<PadreBuscador | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Sincronizar estado interno con prop externo
    useEffect(() => {
        if (seleccionadoId) {
            const padre = padres.find(p => p.id === seleccionadoId)
            if (padre) {
                setPadreSeleccionado(padre)
                // Solo actualizamos el query si no está editando activamente
                if (!isOpen) {
                    setQuery(`${padre.profiles.nombre} ${padre.profiles.apellidos}`)
                }
            }
        } else {
            setPadreSeleccionado(null)
            if (!isOpen) setQuery('')
        }
    }, [seleccionadoId, padres, isOpen])

    // Cerrar al hacer click fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                // Si cerramos y hay seleccionado, restaurar texto
                if (padreSeleccionado) {
                    setQuery(`${padreSeleccionado.profiles.nombre} ${padreSeleccionado.profiles.apellidos}`)
                } else {
                    setQuery('')
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [wrapperRef, padreSeleccionado])

    const padresFiltrados = query === ''
        ? padres.slice(0, 10)
        : padres.filter((padre) => {
            const nombreCompleto = `${padre.profiles.nombre} ${padre.profiles.apellidos}`.toLowerCase()
            const email = padre.profiles.email.toLowerCase()
            const busqueda = query.toLowerCase()
            return nombreCompleto.includes(busqueda) || email.includes(busqueda)
        }).slice(0, 50)

    const handleSelect = (padre: PadreBuscador) => {
        setPadreSeleccionado(padre)
        setQuery(`${padre.profiles.nombre} ${padre.profiles.apellidos}`)
        onSeleccionar(padre.id)
        setIsOpen(false)
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation() // Evitar propagación al wrapper
        setPadreSeleccionado(null)
        setQuery('')
        onSeleccionar('')
        setIsOpen(true) // Mantener abierto para buscar de nuevo
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value)
        setIsOpen(true)

        // Si el usuario borra todo, limpiar selección
        if (e.target.value === '') {
            setPadreSeleccionado(null)
            onSeleccionar('')
        }
    }

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Buscar padre por nombre..."
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    className="pl-8 pr-8"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {padresFiltrados.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                            No se encontraron resultados
                        </div>
                    ) : (
                        <div className="py-1">
                            {padresFiltrados.map((padre) => (
                                <div
                                    key={padre.id}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between ${padreSeleccionado?.id === padre.id ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={() => handleSelect(padre)}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="bg-gray-100 p-1.5 rounded-full flex-shrink-0">
                                            <User className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <div className="truncate">
                                            <div className={`font-medium ${padreSeleccionado?.id === padre.id ? 'text-blue-700' : 'text-gray-900'}`}>
                                                {padre.profiles.nombre} {padre.profiles.apellidos}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {padre.profiles.email}
                                            </div>
                                        </div>
                                    </div>
                                    {padreSeleccionado?.id === padre.id && (
                                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
