'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import {
    BookOpen,
    FileText,
    DollarSign,
    GraduationCap,
    UserCog,
    Receipt,
    Users,
    List,
    LogOut,
    Menu,
    X,
    LayoutDashboard,
    ChevronRight,
    School,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
    {
        label: 'Panel de Control',
        href: '/directivo',
        icon: LayoutDashboard,
        exact: true,
    },
    {
        label: 'Usuarios',
        href: '/directivo/usuarios',
        icon: UserCog,
    },
    {
        label: 'Alumnos por Grado',
        href: '/directivo/alumnos-por-grado',
        icon: Users,
    },
    {
        label: 'Cursos',
        href: '/directivo/cursos',
        icon: BookOpen,
    },
    {
        label: 'Grados y Grupos',
        href: '/directivo/grados-grupos',
        icon: List,
    },
    {
        label: 'Pagos',
        href: '/directivo/pagos',
        icon: DollarSign,
    },
    {
        label: 'Boletas',
        href: '/directivo/boletas',
        icon: Receipt,
    },
    {
        label: 'Relaciones Padre-Alumno',
        href: '/directivo/relaciones-padre-alumno',
        icon: Users,
    },
]

export default function DirectivoLayout({ children }: { children: React.ReactNode }) {
    const supabase = useMemo(() => createClient(), [])
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userName, setUserName] = useState('')

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data: profile } = await supabase
                .from('profiles')
                .select('nombre, apellidos')
                .eq('id', user.id)
                .single()
            if (profile) {
                setUserName(`${profile.nombre} ${profile.apellidos}`)
            }
        }
        loadUser()
    }, [])

    // Close sidebar on route change
    useEffect(() => {
        setSidebarOpen(false)
    }, [pathname])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const isActive = (item: typeof navItems[0]) => {
        if (item.exact) return pathname === item.href
        return pathname.startsWith(item.href)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Skip to content link for keyboard users */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
            >
                Saltar al contenido principal
            </a>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                id="sidebar"
                role="navigation"
                aria-label="Navegación principal"
                className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30
          flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto
        `}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="relative h-8 w-8 flex-shrink-0">
                            <Image src="/logo.png" alt="Logo Sistema Escolar" fill className="object-contain" priority />
                        </div>
                        <span className="font-bold text-gray-900 text-sm leading-tight">
                            Sistema<br />Escolar
                        </span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Cerrar menú"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                {/* User Info */}
                {userName && (
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Directivo</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                    </div>
                )}

                {/* Nav Links */}
                <nav aria-label="Secciones del sistema" className="flex-1 overflow-y-auto py-4 px-3">
                    <ul role="list" className="space-y-1">
                        {navItems.map((item) => {
                            const active = isActive(item)
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        aria-current={active ? 'page' : undefined}
                                        className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors duration-150 group
                      ${active
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                            }
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                    `}
                                    >
                                        <item.icon
                                            className={`h-4 w-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                                            aria-hidden="true"
                                        />
                                        <span className="flex-1">{item.label}</span>
                                        {active && <ChevronRight className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Sign out */}
                <div className="p-3 border-t border-gray-100">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    >
                        <LogOut className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile top bar */}
                <header className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Abrir menú de navegación"
                        aria-expanded={sidebarOpen}
                        aria-controls="sidebar"
                    >
                        <Menu className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="relative h-6 w-6 flex-shrink-0">
                            <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">Sistema Escolar</span>
                    </div>
                </header>

                {/* Page content */}
                <main
                    id="main-content"
                    tabIndex={-1}
                    className="flex-1 outline-none"
                >
                    {children}
                </main>
            </div>
        </div>
    )
}
