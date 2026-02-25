export interface Alumno {
    id: string
    matricula: string
    curp?: string
    grado: string
    grupo: string
    user_id: string
    profiles: {
        nombre: string
        apellidos: string
        email: string
        activo: boolean
        telefono?: string
    }
}

export interface Maestro {
    id: string
    user_id: string
    nombre: string
    apellidos: string
    email: string
    activo: boolean
    especialidad?: string
    telefono?: string
}

export interface Auxiliar {
    id: string
    user_id: string
    nombre: string
    apellidos: string
    email: string
    activo: boolean
    telefono?: string
}
