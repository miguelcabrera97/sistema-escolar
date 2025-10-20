# Progreso del Proyecto - Sistema Escolar

**Fecha de actualización:** 20 de Octubre, 2025
**Versión de Next.js:** 15.5.4
**Estado:** En Desarrollo Activo

---

## Índice

1. [Descripción General](#descripción-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Funcionalidades Implementadas](#funcionalidades-implementadas)
4. [Arquitectura del Sistema](#arquitectura-del-sistema)
5. [Roles de Usuario](#roles-de-usuario)
6. [Características por Rol](#características-por-rol)
7. [Sistema de Autenticación](#sistema-de-autenticación)
8. [Gestión de Usuarios](#gestión-de-usuarios)
9. [Sistema de Tareas](#sistema-de-tareas)
10. [Sistema de Pagos](#sistema-de-pagos)
11. [Base de Datos](#base-de-datos)
12. [Próximas Funcionalidades](#próximas-funcionalidades)
13. [Documentación Disponible](#documentación-disponible)

---

## Descripción General

Sistema de gestión escolar completo construido con Next.js 15 que permite la administración de alumnos, maestros, padres y directivos. El sistema incluye gestión de tareas, pagos, usuarios y perfiles personalizados por rol.

### Objetivos del Proyecto

- ✅ Gestión centralizada de usuarios escolares
- ✅ Sistema de tareas y entregas para alumnos
- ✅ Plataforma de pagos integrada
- ✅ Dashboards personalizados por rol
- ✅ Autenticación y autorización robusta
- ✅ Sistema de calificaciones completo
- ✅ Sistema de gestión de cursos
- 🚧 Comunicación entre padres y maestros
- 🚧 Reportes y estadísticas

---

## Stack Tecnológico

### Frontend
- **Framework:** Next.js 15.5.4 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS 4
- **Componentes UI:** Radix UI (vía shadcn/ui)
- **Formularios:** React Hook Form + Zod
- **Iconos:** Lucide React

### Backend
- **Runtime:** Node.js
- **Server Actions:** Next.js Server Actions
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Pagos:** Stripe

### Desarrollo
- **Package Manager:** npm
- **Bundler:** Turbopack (Next.js 15)
- **Linting:** ESLint
- **Git:** Control de versiones

---

## Funcionalidades Implementadas

### ✅ Completadas

#### 1. Sistema de Autenticación
- [x] Login con email y contraseña
- [x] Middleware de autenticación
- [x] Protección de rutas por rol
- [x] Redirección automática según rol
- [x] Gestión de sesiones con Supabase
- [x] Helpers de autenticación (requireAuth, checkUserRole)

#### 2. Gestión de Usuarios (CRUD Completo)
- [x] Crear alumnos con matrícula única
- [x] Crear maestros con especialidad
- [x] Editar información de alumnos
- [x] Editar información de maestros
- [x] Desactivar/eliminar usuarios (soft delete)
- [x] Reactivar usuarios desactivados
- [x] Validación de datos únicos (matrícula, email)
- [x] Diálogos de confirmación para acciones destructivas

#### 3. Dashboards por Rol
- [x] Dashboard de Alumno (con acceso rápido a calificaciones)
- [x] Dashboard de Maestro
- [x] Dashboard de Padre (con acceso rápido a calificaciones de hijos)
- [x] Dashboard de Directivo (con acceso a gestión de cursos)

#### 4. Sistema de Tareas
- [x] Creación de tareas por maestros
- [x] Visualización de tareas para alumnos
- [x] Entrega de tareas por alumnos
- [x] Revisión de entregas por maestros
- [x] Vista detallada de tarea individual

#### 5. Sistema de Pagos
- [x] Integración con Stripe
- [x] Vista de pagos para padres
- [x] Vista de pagos para directivos
- [x] Webhook de Stripe para confirmación
- [x] Sesiones de pago seguras

#### 6. Sistema de Calificaciones
- [x] Calificación de entregas por maestros
- [x] Vista de calificaciones para alumnos
- [x] Vista de calificaciones para padres (con selector de hijos)
- [x] Cálculo de promedios por curso
- [x] Cálculo de promedio general
- [x] Retroalimentación de maestros
- [x] Badges de rendimiento con colores
- [x] Estadísticas detalladas

#### 7. Sistema de Gestión de Cursos
- [x] CRUD completo de cursos
- [x] Asignación de maestros a cursos
- [x] Inscripción masiva de alumnos
- [x] Desinscripción individual de alumnos
- [x] Vista de alumnos disponibles vs inscritos
- [x] Búsqueda en tiempo real de alumnos
- [x] Validaciones de maestros activos
- [x] Protección contra eliminación con tareas

#### 8. Búsqueda y Filtros
- [x] Búsqueda de alumnos por matrícula/nombre
- [x] Búsqueda de maestros por nombre/email
- [x] Filtros por grado, grupo y estado (alumnos)
- [x] Filtro por estado (maestros)
- [x] Limpieza rápida de filtros
- [x] Contador de resultados filtrados

#### 9. Componentes UI
- [x] Sistema de componentes reutilizables (shadcn/ui)
- [x] Cards, Tables, Buttons, Badges
- [x] Dialogs modales
- [x] Forms con validación
- [x] Loading states
- [x] Empty states
- [x] Tabs para navegación
- [x] Checkboxes para selección múltiple
- [x] Selects con búsqueda

### 🚧 En Progreso

- [ ] Exportación de datos (CSV/Excel)
- [ ] Importación masiva de usuarios
- [ ] Sistema de notificaciones
- [ ] Gráficas de rendimiento

### 📋 Planificadas

- [ ] Exportación de boletas en PDF (Próxima a implementar)
- [ ] Reportes y estadísticas avanzadas
- [ ] Chat/mensajería entre usuarios
- [ ] Calendario escolar
- [ ] Asistencia
- [ ] Biblioteca de recursos
- [ ] Historial de calificaciones por períodos

---

## Arquitectura del Sistema

### Estructura de Carpetas

```
sistema-escolar/
├── scripts/
│   ├── seed-database.ts      # Script para llenar BD con datos de prueba
│   ├── clean-database.ts     # Script para limpiar toda la BD
│   └── README.md            # Documentación de scripts
├── app/
│   ├── actions/              # Server Actions
│   │   ├── usuarios-actions.ts
│   │   └── cursos-actions.ts
│   ├── alumno/              # Rutas del alumno
│   │   ├── page.tsx
│   │   ├── calificaciones/
│   │   └── tarea/[id]/
│   ├── maestro/             # Rutas del maestro
│   │   ├── page.tsx
│   │   ├── crear-tarea/
│   │   └── tarea/[id]/entregas/
│   ├── padre/               # Rutas del padre
│   │   ├── page.tsx
│   │   ├── calificaciones/
│   │   └── pagos/
│   ├── directivo/           # Rutas del directivo
│   │   ├── page.tsx
│   │   ├── cursos/          # Gestión de cursos
│   │   ├── alumnos/
│   │   ├── pagos/
│   │   └── usuarios/
│   ├── api/                 # API Routes
│   │   ├── create-payment-session/
│   │   └── webhooks/stripe/
│   ├── login/
│   └── layout.tsx
├── components/
│   ├── ui/                  # Componentes de shadcn/ui
│   └── protected-layout.tsx
├── lib/
│   ├── supabase.ts          # Cliente de Supabase (browser)
│   ├── supabase-server.ts   # Cliente de Supabase (server)
│   ├── auth-helpers.ts      # Helpers de autenticación
│   └── utils.ts
├── middleware.ts            # Middleware de autenticación
├── DATOS-PRUEBA.md          # Credenciales y datos de prueba
├── PROGRESO-PROYECTO.md     # Estado general del proyecto (este archivo)
└── docs/
    ├── AUTHENTICATION.md
    ├── GESTION-USUARIOS.md
    ├── SISTEMA-CALIFICACIONES.md
    ├── SISTEMA-GESTION-CURSOS.md
    └── EJEMPLO-USO-MIDDLEWARE.md
```

### Patrones de Diseño

1. **Server Components First:** Uso de Server Components por defecto
2. **Server Actions:** Para mutaciones de datos
3. **Middleware:** Para protección de rutas y autenticación
4. **Soft Delete:** Desactivación en lugar de eliminación física
5. **Role-Based Access Control (RBAC):** Control granular de permisos
6. **Optimistic Updates:** En listas después de mutaciones

---

## Roles de Usuario

### 1. Alumno (alumno)
**Descripción:** Estudiante del sistema escolar

**Permisos:**
- Ver tareas asignadas
- Entregar tareas
- Ver calificaciones y promedios
- Ver retroalimentación de maestros
- Ver su información personal

**Rutas accesibles:**
- `/alumno`
- `/alumno/tarea/[id]`
- `/alumno/calificaciones`

### 2. Maestro (maestro)
**Descripción:** Profesor que imparte clases

**Permisos:**
- Crear tareas para grupos/grados
- Ver entregas de alumnos
- Calificar tareas y proporcionar retroalimentación
- Ver estadísticas de entregas
- Ver lista de alumnos asignados

**Rutas accesibles:**
- `/maestro`
- `/maestro/crear-tarea`
- `/maestro/tarea/[id]/entregas`

### 3. Padre (padre)
**Descripción:** Padre o tutor de un alumno

**Permisos:**
- Ver información de sus hijos
- Ver calificaciones de sus hijos
- Selector para múltiples hijos
- Realizar pagos
- Ver historial de pagos

**Rutas accesibles:**
- `/padre`
- `/padre/pagos`
- `/padre/calificaciones`

### 4. Directivo (directivo)
**Descripción:** Administrador del sistema escolar

**Permisos:**
- CRUD completo de usuarios (alumnos, maestros)
- CRUD completo de cursos
- Asignación de maestros a cursos
- Inscripción masiva de alumnos a cursos
- Ver todos los pagos
- Ver lista de todos los alumnos con búsqueda y filtros
- Gestión completa del sistema

**Rutas accesibles:**
- `/directivo`
- `/directivo/alumnos`
- `/directivo/cursos`
- `/directivo/pagos`
- `/directivo/usuarios`

---

## Características por Rol

### Dashboard de Alumno

**Archivo:** `app/alumno/page.tsx`

**Características:**
- Tarjeta de bienvenida personalizada
- Lista de tareas pendientes
- Botón para ver detalles de cada tarea
- Indicadores de estado de entregas
- Tarjeta de promedio con acceso rápido a calificaciones
- Estadísticas de tareas y cursos

### Dashboard de Maestro

**Archivo:** `app/maestro/page.tsx`

**Características:**
- Acceso rápido a crear nuevas tareas
- Vista general de tareas creadas
- Acceso a revisar entregas
- Estadísticas de entregas

### Dashboard de Padre

**Archivo:** `app/padre/page.tsx`

**Características:**
- Información de hijos matriculados
- Selector de múltiples hijos
- Tarjeta de calificaciones con acceso rápido
- Acceso a pagos pendientes
- Botón de crear sesión de pago
- Historial de transacciones

### Dashboard de Directivo

**Archivo:** `app/directivo/page.tsx`

**Características:**
- Acceso a gestión de cursos
- Acceso a gestión de usuarios
- Ver lista completa de alumnos
- Administración de pagos
- Estadísticas generales del sistema
- Botones de acceso rápido a todas las funcionalidades

---

## Sistema de Autenticación

### Arquitectura

El sistema utiliza **Supabase Auth** con **middleware de Next.js 15** para proteger rutas.

### Componentes Clave

#### 1. Middleware (`middleware.ts`)
- Intercepta todas las requests
- Valida sesión de usuario
- Verifica rol y permisos
- Redirige según corresponda

**Flujo:**
```
Request → Middleware → Validar Auth → Verificar Rol → Permitir/Denegar
```

#### 2. Helpers de Autenticación (`lib/auth-helpers.ts`)

**Funciones principales:**

```typescript
// Requiere autenticación y rol específico
requireAuth(allowedRoles?: UserRole[]): Promise<AuthCheck>

// Obtiene ruta del dashboard según rol
getDashboardPath(role: UserRole): string

// Verifica si usuario tiene un rol específico
hasRole(user: User, role: UserRole): Promise<boolean>
```

#### 3. Cliente de Supabase

**Browser Client** (`lib/supabase.ts`):
```typescript
export function createClient()
```

**Server Client** (`lib/supabase-server.ts`):
```typescript
export async function createServerSupabaseClient()
export async function getCurrentUser()
export async function checkUserRole(userId: string)
```

### Protección de Rutas

**Ejemplo de uso en una página:**

```typescript
// app/directivo/usuarios/page.tsx
import { requireAuth } from '@/lib/auth-helpers'

export default async function UsuariosPage() {
  await requireAuth(['directivo'])
  // Solo directivos pueden acceder aquí
  return <div>...</div>
}
```

### Rutas Públicas vs Protegidas

**Públicas:**
- `/` (Landing page)
- `/login`

**Protegidas:**
- `/alumno/*` - Solo alumnos
- `/maestro/*` - Solo maestros
- `/padre/*` - Solo padres
- `/directivo/*` - Solo directivos

---

## Gestión de Usuarios

### Funcionalidades Completas

#### 1. Crear Usuarios

**Alumnos:**
- Formulario: `app/directivo/usuarios/FormularioAlumno.tsx`
- Server Action: `crearAlumno()`
- Campos requeridos: nombre, apellidos, matrícula, grado, grupo, email, contraseña
- Campos opcionales: fecha_nacimiento, teléfono

**Maestros:**
- Formulario: `app/directivo/usuarios/FormularioMaestro.tsx`
- Server Action: `crearMaestro()`
- Campos requeridos: nombre, apellidos, email, contraseña
- Campos opcionales: especialidad, teléfono

#### 2. Editar Usuarios

**Alumnos:**
- Componente: `DialogoEditarAlumno.tsx`
- Server Action: `editarAlumno()`
- Validación: Matrícula única
- Permite modificar todos los campos excepto contraseña

**Maestros:**
- Componente: `DialogoEditarMaestro.tsx`
- Server Action: `editarMaestro()`
- Permite modificar todos los campos excepto contraseña

#### 3. Eliminar/Desactivar Usuarios (Soft Delete)

**Implementación:**
- Campo `activo` en tabla `profiles`
- No se eliminan datos físicamente
- Usuarios desactivados no pueden acceder al sistema

**Alumnos:**
- Server Actions: `desactivarAlumno()`, `reactivarAlumno()`
- UI: Botón de eliminar (🗑️) y reactivar (🔄)
- Diálogo de confirmación antes de desactivar

**Maestros:**
- Server Actions: `desactivarMaestro()`, `reactivarMaestro()`
- UI: Botón de eliminar (🗑️) y reactivar (🔄)
- Diálogo de confirmación antes de desactivar

#### 4. Visualización de Usuarios

**Lista de Alumnos:**
- Componente: `ListaAlumnos.tsx`
- Muestra: Matrícula, nombre completo, grado, grupo, email, teléfono, estado
- Badges para estado activo/inactivo
- Opacidad reducida para usuarios inactivos
- Botones de editar (solo activos), eliminar/reactivar

**Lista de Maestros:**
- Componente: `ListaMaestros.tsx`
- Muestra: Nombre completo, email, teléfono, estado
- Badges para estado activo/inactivo
- Opacidad reducida para usuarios inactivos
- Botones de editar (solo activos), eliminar/reactivar

### Server Actions Disponibles

**Archivo:** `app/actions/usuarios-actions.ts`

```typescript
// CREAR
crearAlumno(data: CrearAlumnoData): Promise<Result>
crearMaestro(data: CrearMaestroData): Promise<Result>

// LEER
obtenerAlumnos(): Promise<Result>
obtenerMaestros(): Promise<Result>
obtenerAlumnoPorId(alumnoId: string): Promise<Result>
obtenerMaestroPorId(maestroId: string): Promise<Result>

// ACTUALIZAR
editarAlumno(data: EditarAlumnoData): Promise<Result>
editarMaestro(data: EditarMaestroData): Promise<Result>

// DESACTIVAR/REACTIVAR
desactivarAlumno(alumnoId: string): Promise<Result>
reactivarAlumno(alumnoId: string): Promise<Result>
desactivarMaestro(maestroId: string): Promise<Result>
reactivarMaestro(maestroId: string): Promise<Result>
```

### Validaciones Implementadas

1. **Matrícula única:** No puede haber dos alumnos con la misma matrícula
2. **Email único:** Validado por Supabase Auth
3. **Contraseña segura:** Mínimo 6 caracteres
4. **Permisos de rol:** Solo directivos pueden gestionar usuarios
5. **Campos requeridos:** Validados en cliente y servidor
6. **Manejo de nulos:** Conversión de strings vacíos a null para fechas y teléfonos

### Bugs Corregidos

#### Bug #1: Error de tipo de dato en fecha
**Error:** `invalid input syntax for type date: ""`
**Causa:** Envío de string vacío a campo date de PostgreSQL
**Solución:** Conversión de strings vacíos a null

```typescript
// Antes
fecha_nacimiento: data.fecha_nacimiento

// Después
fecha_nacimiento: data.fecha_nacimiento || null
telefono: data.telefono || null
```

---

## Sistema de Tareas

### Funcionalidades

#### Para Maestros
- Crear tareas con título, descripción y fecha límite
- Asignar a grados y grupos específicos
- Ver todas las entregas de una tarea
- Revisar entregas individuales

#### Para Alumnos
- Ver tareas asignadas a su grado/grupo
- Entregar tareas dentro del límite
- Ver detalles de cada tarea
- Estado de entrega visible

### Archivos Principales

- `app/maestro/crear-tarea/page.tsx` - Formulario de creación
- `app/maestro/tarea/[id]/entregas/page.tsx` - Vista de entregas
- `app/alumno/page.tsx` - Lista de tareas del alumno
- `app/alumno/tarea/[id]/page.tsx` - Vista y entrega de tarea

---

## Sistema de Pagos

### Integración con Stripe

**Características:**
- Sesiones de pago seguras
- Webhooks para confirmación automática
- Historial de transacciones
- Vista para padres y directivos

### Archivos Clave

- `app/api/create-payment-session/route.ts` - Crear sesión de pago
- `app/api/webhooks/stripe/route.ts` - Webhook de confirmación
- `app/padre/pagos/page.tsx` - Vista de pagos para padres
- `app/directivo/pagos/page.tsx` - Vista de pagos para directivos

### Flujo de Pago

```
1. Padre accede a /padre/pagos
2. Click en "Crear sesión de pago"
3. Redirige a Stripe Checkout
4. Padre completa el pago
5. Stripe envía webhook
6. Sistema actualiza estado del pago
7. Confirmación al padre
```

---

## Base de Datos

### Esquema de Supabase

#### Tabla: `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('alumno', 'maestro', 'padre', 'directivo')),
  telefono TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: `alumnos`
```sql
CREATE TABLE alumnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  matricula TEXT UNIQUE NOT NULL,
  grado TEXT NOT NULL,
  grupo TEXT NOT NULL,
  fecha_nacimiento DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: `tareas`
```sql
CREATE TABLE tareas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curso_id UUID REFERENCES cursos(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_entrega TIMESTAMP,
  puntos_maximos NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Nota:** El campo `fecha_entrega` representa la fecha límite de entrega de la tarea.

#### Tabla: `entregas`
```sql
CREATE TABLE entregas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID REFERENCES tareas(id) ON DELETE CASCADE,
  alumno_id UUID REFERENCES alumnos(id),
  contenido TEXT,
  archivo_url TEXT,
  fecha_entrega TIMESTAMP DEFAULT NOW()
);
```

### Políticas RLS (Row Level Security)

- Alumnos solo ven sus propias entregas
- Maestros ven entregas de sus tareas
- Directivos tienen acceso completo
- Padres ven información de sus hijos

---

## Próximas Funcionalidades

### Prioridad Alta 🔴

1. **Notificaciones**
   - Notificaciones en tiempo real
   - Email para eventos importantes
   - Recordatorios de tareas
   - Avisos de pagos

### Prioridad Media 🟡

2. **Exportación de Datos**
   - Exportar listas a CSV/Excel
   - Exportar boletas en PDF
   - Reportes personalizados
   - Historial de movimientos

3. **Importación Masiva**
   - Subir CSV con múltiples alumnos
   - Validación de datos
   - Preview antes de importar

4. **Perfil de Usuario**
   - Fotos de perfil
   - Editar información personal
   - Cambiar contraseña
   - Configuración de preferencias

5. **Gestión Avanzada de Cursos**
   - Horarios de clases
   - Aulas asignadas
   - Capacidad máxima por curso

### Prioridad Baja 🟢

6. **Chat/Mensajería**
   - Comunicación padre-maestro
   - Mensajes del directivo
   - Notificaciones de nuevos mensajes

7. **Calendario Escolar**
   - Eventos escolares
   - Días festivos
   - Sincronización con Google Calendar

8. **Biblioteca de Recursos**
   - Subir materiales didácticos
   - Compartir recursos entre maestros
   - Acceso de alumnos a materiales

9. **Asistencia**
   - Registro de asistencia diaria
   - Reportes de inasistencias
   - Notificaciones a padres

10. **Estadísticas y Analytics**
    - Dashboard de métricas avanzadas
    - Gráficas de rendimiento
    - Reportes ejecutivos para directivos
    - Análisis predictivo de rendimiento

---

## Documentación Disponible

### 1. AUTHENTICATION.md
**Contenido:**
- Arquitectura del sistema de autenticación
- Guía de uso del middleware
- Helpers de autenticación
- Ejemplos de protección de rutas
- Troubleshooting

### 2. GESTION-USUARIOS.md
**Contenido:**
- Cómo agregar alumnos y maestros
- Cómo editar usuarios existentes
- Gestión de soft delete
- Validaciones implementadas
- Ejemplos de uso
- Estructura de Server Actions
- Manejo de errores

### 3. SISTEMA-CALIFICACIONES.md
**Contenido:**
- Sistema completo de calificaciones
- Funcionalidades por rol (maestros, alumnos, padres)
- Calificación de entregas
- Vista de calificaciones con promedios
- Cálculo de promedios por curso y general
- Retroalimentación de maestros
- Badges de rendimiento
- Flujos de trabajo

### 4. SISTEMA-GESTION-CURSOS.md
**Contenido:**
- CRUD completo de cursos
- Asignación de maestros
- Inscripción masiva de alumnos
- Desinscripción individual
- Vista de alumnos disponibles vs inscritos
- Búsqueda y filtrado
- Server Actions
- Validaciones y reglas de negocio

### 5. EJEMPLO-USO-MIDDLEWARE.md
**Contenido:**
- 10 ejemplos prácticos del middleware
- Casos de uso comunes
- Patrones de implementación

### 6. README.md
**Contenido:**
- Instalación del proyecto
- Configuración de variables de entorno
- Scripts disponibles
- Stack tecnológico

### 7. PROGRESO-PROYECTO.md (este archivo)
**Contenido:**
- Estado general del proyecto
- Funcionalidades implementadas
- Arquitectura del sistema
- Próximas funcionalidades
- Changelog completo

---

## Estado del Proyecto

### Métricas de Desarrollo

- **Total de Rutas:** 22+
- **Server Actions:** 21+
- **Componentes UI:** 40+
- **Roles Implementados:** 4
- **Tablas de BD:** 8+
- **Scripts de BD:** 2 (seed, clean)
- **Commits:** 20+
- **Documentación:** 9 archivos .md

### Última Actualización

**Fecha:** 20 de Octubre, 2025
**Última característica implementada:** Scripts de seed y limpieza de base de datos
**Funcionalidades recientes:**
- ✅ Script de seed con datos de prueba realistas
- ✅ Script de limpieza de base de datos
- ✅ Corrección de nombres de columnas en toda la aplicación
- ✅ Sistema completamente funcional con datos de prueba
- ✅ Documentación de credenciales y datos de prueba

### Estado de Compilación

✅ **Build exitoso** - Última verificación: 20/10/2025
✅ **Sin errores de TypeScript**
✅ **Sin errores de ESLint** (modo ignorado temporalmente)
✅ **Todas las rutas funcionando**
✅ **Sistema de calificaciones operativo**
✅ **Sistema de cursos operativo**
✅ **Scripts de BD funcionando**
✅ **Datos de prueba cargados correctamente**

---

## Instalación y Configuración

### Requisitos Previos

- Node.js 18+
- npm o pnpm
- Cuenta de Supabase
- Cuenta de Stripe (opcional)

### Variables de Entorno

Crear archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
STRIPE_SECRET_KEY=tu_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=tu_stripe_public_key
STRIPE_WEBHOOK_SECRET=tu_webhook_secret
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm run start

# Linting
npm run lint

# Scripts de Base de Datos
npm run seed    # Llenar BD con datos de prueba
npm run clean   # Limpiar toda la BD (requiere confirmación)
```

### Datos de Prueba

El sistema incluye un script de seed que crea automáticamente:
- **1 Directivo** (directora@escuela.edu / 123456)
- **6 Maestros** (carlos.martinez@escuela.edu / 123456, etc.)
- **20 Alumnos** distribuidos en 3°A, 3°B, 4°A, 5°A
- **5 Padres** vinculados a alumnos
- **9 Cursos** con inscripciones automáticas
- **Tareas** listas para ser creadas por maestros

Ver `DATOS-PRUEBA.md` para lista completa de credenciales.

---

## Contacto y Soporte

Para reportar bugs o solicitar funcionalidades:
- Crear un issue en el repositorio
- Revisar la documentación existente
- Consultar los logs del servidor

---

## Changelog Reciente

### v0.5.0 - Búsqueda y Filtros + UX Improvements (19/10/2025)
- ✅ Sistema de búsqueda en tiempo real para alumnos
- ✅ Sistema de búsqueda en tiempo real para maestros
- ✅ Filtros múltiples: grado, grupo, estado (alumnos)
- ✅ Filtro por estado (maestros)
- ✅ Botón de limpiar filtros
- ✅ Contador de resultados filtrados
- ✅ Empty state para "sin resultados"
- ✅ Acceso rápido a calificaciones desde dashboard de alumno
- ✅ Acceso rápido a calificaciones desde dashboard de padre
- ✅ Acceso rápido a gestión de cursos desde dashboard de directivo
- ✅ Mejoras en UX de las tarjetas clicables

### v0.4.0 - Sistemas de Calificaciones y Cursos (19/10/2025)

**Sistema de Calificaciones:**
- ✅ Calificación de entregas por maestros con retroalimentación
- ✅ Vista de calificaciones para alumnos organizada por curso
- ✅ Vista de calificaciones para padres con selector de hijos
- ✅ Cálculo automático de promedios por curso
- ✅ Cálculo automático de promedio general ponderado
- ✅ Badges de rendimiento con colores (verde, amarillo, rojo)
- ✅ Estadísticas detalladas (tareas calificadas, cursos, promedios)
- ✅ Documentación completa en SISTEMA-CALIFICACIONES.md

**Sistema de Gestión de Cursos:**
- ✅ CRUD completo de cursos
- ✅ Asignación de maestros activos a cursos
- ✅ Inscripción masiva de alumnos con checkboxes
- ✅ Desinscripción individual de alumnos
- ✅ Vista con tabs: Disponibles vs Inscritos
- ✅ Búsqueda en tiempo real de alumnos para inscribir
- ✅ Validaciones: maestros activos, unicidad de inscripciones
- ✅ Protección contra eliminación de cursos con tareas
- ✅ Componente Checkbox creado
- ✅ Server Actions completas (9 acciones)
- ✅ Documentación completa en SISTEMA-GESTION-CURSOS.md

### v0.3.0 - Sistema de Soft Delete (18/10/2025)
- ✅ Implementado soft delete para alumnos
- ✅ Implementado soft delete para maestros
- ✅ Agregado campo `activo` a profiles
- ✅ Server Actions: desactivar/reactivar
- ✅ UI: Badges de estado activo/inactivo
- ✅ UI: Botones condicionales eliminar/reactivar
- ✅ Diálogo de confirmación reutilizable
- ✅ Opacidad visual para usuarios inactivos

### v0.2.0 - Sistema de Edición (17/10/2025)
- ✅ Editar alumnos existentes
- ✅ Editar maestros existentes
- ✅ Validación de matrícula única en edición
- ✅ Diálogos modales para edición
- 🐛 Fix: Manejo de campos nulos (fecha, teléfono)

### v0.1.0 - Base del Sistema (15-16/10/2025)
- ✅ Middleware de autenticación
- ✅ Protección de rutas por rol
- ✅ CRUD de usuarios (crear y leer)
- ✅ Dashboards por rol
- ✅ Sistema de tareas básico
- ✅ Integración de pagos con Stripe

---

**Proyecto:** Sistema Escolar
**Desarrollado con:** Next.js 15 + Supabase + Stripe
**Última actualización:** 19 de Octubre, 2025
**Versión actual:** v0.5.0
