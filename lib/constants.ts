import type { UserRole } from './auth-helpers'

export const ROLE_DASHBOARD: Record<UserRole, string> = {
    alumno: '/alumno',
    maestro: '/maestro',
    padre: '/padre',
    directivo: '/directivo',
    auxiliar_calificaciones: '/auxiliar',
}
