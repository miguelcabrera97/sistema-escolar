/**
 * Tipo genérico para retornos de funciones consistentemente
 */
export type Result<T = any> = {
    success: boolean
    data?: T
    error?: string
    errors?: Record<string, string[]>
    message?: string
}
