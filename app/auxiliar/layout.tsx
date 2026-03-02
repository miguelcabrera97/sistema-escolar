'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { FileText, ClipboardCheck, LogOut, Menu, X, ChevronRight, School, LayoutDashboard } from 'lucide-react'

const supabase = createClient()

const navItems = [
    { label: 'Panel Principal', href: '/auxiliar', icon: LayoutDashboard, exact: true },
    { label: 'Boletas', href: '/auxiliar/boletas', icon: FileText },
    { label: 'Calificaciones', href: '/auxiliar/tarea', icon: ClipboardCheck },
]

export default function AuxiliarLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userName, setUserName] = useState('')

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data: profile } = await supabase.from('profiles').select('nombre, apellidos').eq('id', user.id).single()
            if (profile) setUserName(`${profile.nombre} ${profile.apellidos}`)
        }
        loadUser()
    }, [])

    useEffect(() => { setSidebarOpen(false) }, [pathname])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const isActive = (item: typeof navItems[0]) =>
        item.exact ? pathname === item.href : pathname.startsWith(item.href)

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-md focus:text-sm focus:font-medium">
                Saltar al contenido principal
            </a>

            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            )}

            <aside id="sidebar" role="navigation" aria-label="Navegación principal"
                className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto`}
            >
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
                            <School className="h-4 w-4 text-white" aria-hidden="true" />
                        </div>
                        <span className="font-bold text-gray-900 text-sm leading-tight">Sistema<br />Escolar</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500" aria-label="Cerrar menú">
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                {userName && (
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Auxiliar de Calificaciones</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                    </div>
                )}

                <nav aria-label="Secciones del sistema" className="flex-1 overflow-y-auto py-4 px-3">
                    <ul role="list" className="space-y-1">
                        {navItems.map((item) => {
                            const active = isActive(item)
                            return (
                                <li key={item.href}>
                                    <Link href={item.href} aria-current={active ? 'page' : undefined}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 group ${active ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'} focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1`}
                                    >
                                        <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`} aria-hidden="true" />
                                        <span className="flex-1">{item.label}</span>
                                        {active && <ChevronRight className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className="p-3 border-t border-gray-100">
                    <button onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    >
                        <LogOut className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        aria-label="Abrir menú de navegación" aria-expanded={sidebarOpen} aria-controls="sidebar"
                    >
                        <Menu className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-teal-600 flex items-center justify-center">
                            <School className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">Sistema Escolar</span>
                    </div>
                </header>

                <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
                    {children}
                </main>
            </div>
        </div>
    )
}
