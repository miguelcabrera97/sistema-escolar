/**
 * Tipo genérico para retornos de funciones consistentemente
 */
export type Result<T = unknown> =
    | { success: true; data?: T; message?: string }
    | { success: false; error?: string; errors?: Record<string, string[]>; message?: string }
