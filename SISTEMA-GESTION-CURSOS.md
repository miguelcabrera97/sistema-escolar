# Sistema de Gestión de Cursos - Documentación Completa

**Fecha:** 19 de Octubre, 2025
**Estado:** ✅ Implementado y Funcional

---

## Índice

1. [Descripción General](#descripción-general)
2. [Funcionalidades](#funcionalidades)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Server Actions](#server-actions)
5. [Vistas Implementadas](#vistas-implementadas)
6. [Flujos de Trabajo](#flujos-de-trabajo)
7. [Guía de Uso](#guía-de-uso)
8. [Archivos del Sistema](#archivos-del-sistema)

---

## Descripción General

El sistema de gestión de cursos permite a los directivos crear cursos escolares, asignar maestros responsables e inscribir alumnos de forma individual o masiva. Es la piedra angular para organizar la estructura académica de la escuela.

### Características Principales

- ✅ Creación de cursos con asignación de maestro
- ✅ Edición de cursos existentes
- ✅ Eliminación de cursos (con validaciones)
- ✅ Inscripción masiva de alumnos
- ✅ Desinscripción individual de alumnos
- ✅ Vista de alumnos inscritos por curso
- ✅ Filtrado de alumnos disponibles para inscripción
- ✅ Búsqueda en tiempo real de alumnos
- ✅ Validaciones de maestros activos
- ✅ Interfaz intuitiva con tabs

---

## Funcionalidades

### 1. Crear Curso

**Campos requeridos:**
- Nombre del curso (ej: Matemáticas, Español)
- Grado (1° a 6°)
- Grupo (A, B, C, D, E, F)
- Maestro asignado

**Campos opcionales:**
- Descripción del curso

**Validaciones:**
- El maestro debe existir y estar activo
- Todos los campos requeridos deben completarse

---

### 2. Editar Curso

**Permite modificar:**
- Nombre del curso
- Descripción
- Grado
- Grupo
- Maestro asignado

**Validaciones:**
- El nuevo maestro debe estar activo
- No se puede dejar ningún campo requerido vacío

---

### 3. Eliminar Curso

**Proceso:**
- Verifica si el curso tiene tareas asociadas
- Si tiene tareas: NO permite eliminar
- Si no tiene tareas: Elimina inscripciones primero, luego el curso

**Protecciones:**
- Confirmación antes de eliminar
- No permite eliminar si hay tareas (para preservar datos académicos)

---

### 4. Inscribir Alumnos

**Métodos:**

#### Inscripción Masiva (Checkbox)
- Seleccionar múltiples alumnos
- Click en "Inscribir"
- Inscribe todos los seleccionados de una vez

#### Características:
- Muestra solo alumnos NO inscritos en el curso
- Búsqueda en tiempo real por matrícula o nombre
- Evita duplicados automáticamente
- Notifica cuántos fueron inscritos y cuántos ya estaban inscritos

---

### 5. Desinscribir Alumno

**Proceso:**
- Vista de alumnos inscritos (tab "Inscritos")
- Click en botón de desinscribir (X)
- Confirmación
- Eliminación de la inscripción

---

## Estructura de Base de Datos

### Tabla: `cursos`

```sql
CREATE TABLE cursos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  grado TEXT NOT NULL,
  grupo TEXT NOT NULL,
  maestro_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `inscripciones`

```sql
CREATE TABLE inscripciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
  alumno_id UUID REFERENCES alumnos(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(curso_id, alumno_id) -- Un alumno no puede estar inscrito 2 veces en el mismo curso
);
```

---

## Server Actions

**Archivo:** `app/actions/cursos-actions.ts`

### Acciones Disponibles:

```typescript
// CRUD de Cursos
crearCurso(data: CrearCursoData): Promise<Result>
obtenerCursos(): Promise<Result>
obtenerCursoPorId(cursoId: string): Promise<Result>
editarCurso(data: EditarCursoData): Promise<Result>
eliminarCurso(cursoId: string): Promise<Result>

// Gestión de Inscripciones
inscribirAlumnos(data: InscribirAlumnosData): Promise<Result>
desinscribirAlumno(inscripcionId: string): Promise<Result>
obtenerAlumnosInscritos(cursoId: string): Promise<Result>
obtenerAlumnosDisponibles(cursoId: string): Promise<Result>
```

### Ejemplo de Uso:

```typescript
// Crear un curso
const result = await crearCurso({
  nombre: 'Matemáticas',
  descripcion: 'Matemáticas para 3er grado',
  grado: '3',
  grupo: 'A',
  maestro_id: 'uuid-del-maestro'
})

if (result.success) {
  console.log('Curso creado:', result.data)
} else {
  console.error('Error:', result.error)
}
```

---

## Vistas Implementadas

### 1. Página Principal de Cursos

**Ruta:** `/directivo/cursos`

**Componentes:**
- `FormularioCurso` - Crear nuevos cursos
- `ListaCursos` - Ver todos los cursos existentes

**Características:**
- Formulario colapsable (se muestra al click en "Nuevo Curso")
- Tabla con todos los cursos
- Acciones rápidas: Inscribir, Editar, Eliminar

---

### 2. Formulario de Creación

**Componente:** `FormularioCurso.tsx`

**Campos:**
```
┌─────────────────────────────────────────┐
│ Nombre del Curso *                      │
│ [___________________________]           │
│                                         │
│ Descripción (Opcional)                  │
│ [___________________________]           │
│                                         │
│ Grado *         Grupo *                 │
│ [Dropdown]      [Dropdown]              │
│                                         │
│ Maestro Asignado *                      │
│ [Dropdown con maestros activos]         │
│                                         │
│ [Crear Curso]  [Cancelar]              │
└─────────────────────────────────────────┘
```

**Validaciones:**
- Carga solo maestros activos
- Deshabilita botón si no hay maestros disponibles
- Muestra spinner mientras carga

---

### 3. Lista de Cursos

**Componente:** `ListaCursos.tsx`

**Tabla con columnas:**
- Curso (nombre + descripción)
- Grado y Grupo (badge)
- Maestro (nombre + email)
- Estado (activo/inactivo según maestro)
- Acciones (inscribir, editar, eliminar)

**Iconos de acciones:**
- 👥 UserPlus (verde) - Inscribir alumnos
- ✏️ Pencil - Editar curso
- 🗑️ Trash (rojo) - Eliminar curso

---

### 4. Diálogo de Inscripción

**Componente:** `DialogoInscribirAlumnos.tsx`

**Tabs:**

#### Tab 1: Disponibles
- Búsqueda de alumnos
- Lista con checkboxes
- Selección múltiple
- Botón "Inscribir" para procesar

#### Tab 2: Inscritos
- Lista de alumnos ya inscritos
- Botón para desinscribir (X rojo)
- Sin edición, solo vista y desinscripción

**Características:**
- Contador de alumnos seleccionados
- Búsqueda en tiempo real
- Botón de "Limpiar" selección
- Filtra automáticamente inscritos vs disponibles

---

### 5. Diálogo de Edición

**Componente:** `DialogoEditarCurso.tsx`

**Características:**
- Pre-llena campos con datos actuales
- Mismas validaciones que creación
- Actualización en tiempo real

---

## Flujos de Trabajo

### Flujo 1: Crear un Curso

```
1. Directivo accede a /directivo/cursos
2. Click en "Nuevo Curso"
3. Formulario se expande
4. Completa datos:
   - Nombre
   - Descripción (opcional)
   - Grado
   - Grupo
   - Selecciona maestro
5. Click en "Crear Curso"
6. Sistema valida:
   ✓ Maestro existe y está activo
   ✓ Campos requeridos completos
7. Curso creado
8. Página se recarga
9. Curso aparece en la lista
```

---

### Flujo 2: Inscribir Alumnos Masivamente

```
1. En la lista de cursos
2. Click en icono 👥 (UserPlus)
3. Se abre diálogo con tabs
4. Tab "Disponibles" seleccionado por defecto
5. Directivo puede:
   a) Buscar alumnos por matrícula/nombre
   b) Seleccionar alumnos con checkboxes
6. Click en "Inscribir" (aparece cuando hay seleccionados)
7. Sistema:
   - Filtra alumnos ya inscritos
   - Crea inscripciones para los nuevos
8. Muestra resultado:
   "5 inscritos, 2 ya estaban inscritos"
9. Actualiza lista automáticamente
```

---

### Flujo 3: Ver Alumnos Inscritos

```
1. Click en icono 👥 del curso
2. Diálogo se abre
3. Click en tab "Inscritos"
4. Se muestra lista de alumnos inscritos
5. Cada alumno muestra:
   - Nombre completo
   - Matrícula
   - Grado y grupo
   - Botón de desinscribir (X)
```

---

### Flujo 4: Desinscribir Alumno

```
1. En tab "Inscritos"
2. Click en botón X (rojo) del alumno
3. Confirmación: "¿Estás seguro?"
4. Si acepta:
   - Elimina inscripción
   - Actualiza listas
   - Muestra confirmación
5. Alumno desaparece de "Inscritos"
6. Alumno aparece en "Disponibles"
```

---

### Flujo 5: Editar Curso

```
1. Click en icono ✏️ (Pencil)
2. Diálogo de edición se abre
3. Campos pre-llenados con datos actuales
4. Directivo modifica:
   - Nombre
   - Descripción
   - Grado
   - Grupo
   - Maestro
5. Click en "Guardar Cambios"
6. Validaciones
7. Actualización exitosa
8. Lista se recarga con nuevos datos
```

---

### Flujo 6: Eliminar Curso

```
1. Click en icono 🗑️ (Trash rojo)
2. Sistema verifica:
   ¿Tiene tareas asociadas?

   SI → Error: "No se puede eliminar, tiene tareas"
   NO → Continúa

3. Diálogo de confirmación
4. Si acepta:
   a) Elimina todas las inscripciones
   b) Elimina el curso
5. Confirmación
6. Lista se actualiza
```

---

## Guía de Uso

### Para Directivos

#### Crear un Curso Nuevo

1. Ir a Dashboard
2. Click en "Gestionar Cursos"
3. Click en "Nuevo Curso"
4. Llenar formulario:
   - **Nombre:** Nombre descriptivo (ej: "Matemáticas")
   - **Descripción:** Breve descripción (opcional)
   - **Grado:** Seleccionar del 1° al 6°
   - **Grupo:** Seleccionar de A a F
   - **Maestro:** Elegir maestro activo
5. Click en "Crear Curso"

#### Inscribir Alumnos a un Curso

**Método 1: Inscripción Masiva**

1. En lista de cursos, click en 👥
2. Tab "Disponibles"
3. Buscar alumnos (opcional)
4. Seleccionar con checkboxes
5. Click en "Inscribir"

**Método 2: Individual**

1. Same as above pero seleccionar uno por uno

#### Buenas Prácticas

✅ **Hacer:**
- Verificar que el maestro esté activo antes de asignar
- Inscribir alumnos del mismo grado que el curso
- Usar descripciones claras para cursos
- Desinscribir alumnos que cambien de grupo

❌ **Evitar:**
- Eliminar cursos con tareas (no se puede)
- Asignar maestros inactivos (el sistema no lo permite)
- Dejar cursos sin alumnos inscritos

---

## Archivos del Sistema

### Estructura de Carpetas:

```
app/
├── actions/
│   └── cursos-actions.ts          # Server Actions para cursos
├── directivo/
│   ├── page.tsx                   # Dashboard (con botón a cursos)
│   └── cursos/
│       ├── page.tsx               # Página principal
│       ├── FormularioCurso.tsx    # Crear curso
│       ├── ListaCursos.tsx        # Lista de cursos
│       ├── DialogoInscribirAlumnos.tsx  # Inscribir/desinscribir
│       └── DialogoEditarCurso.tsx # Editar curso

components/
└── ui/
    ├── checkbox.tsx               # Checkbox (nuevo)
    ├── tabs.tsx                   # Tabs
    ├── dialog.tsx                 # Diálogos modales
    └── ... (otros componentes UI)
```

### Dependencias:

- `@radix-ui/react-checkbox` - Checkboxes
- `@radix-ui/react-tabs` - Tabs
- `@radix-ui/react-dialog` - Modales
- `lucide-react` - Iconos

---

## Validaciones y Reglas de Negocio

### Reglas de Creación:

1. **Maestro Asignado:**
   - Debe existir
   - Debe tener rol "maestro"
   - Debe estar activo (activo = true)

2. **Campos Requeridos:**
   - Nombre
   - Grado
   - Grupo
   - Maestro

3. **Descripción:**
   - Opcional
   - Se guarda como null si está vacía

---

### Reglas de Inscripción:

1. **Unicidad:**
   - Un alumno NO puede inscribirse 2 veces en el mismo curso
   - La BD tiene constraint UNIQUE(curso_id, alumno_id)

2. **Filtrado Automático:**
   - Solo muestra alumnos disponibles (no inscritos)
   - Filtra en backend para garantizar consistencia

3. **Inscripción Masiva:**
   - Si un alumno ya está inscrito, lo omite
   - Notifica cuántos fueron omitidos

---

### Reglas de Eliminación:

1. **Protección de Datos:**
   - NO se puede eliminar si tiene tareas asociadas
   - Esto protege el historial académico

2. **Cascada:**
   - Al eliminar un curso SIN tareas:
     - Primero elimina inscripciones
     - Luego elimina el curso

3. **Confirmación:**
   - Siempre requiere confirmación del usuario

---

## Troubleshooting

### Problema: No aparecen maestros en el dropdown

**Causa:** No hay maestros activos
**Solución:**
1. Ir a Gestionar Usuarios
2. Crear un maestro nuevo O
3. Reactivar un maestro inactivo

---

### Problema: No puedo eliminar un curso

**Causa:** El curso tiene tareas asociadas
**Solución:**
1. No se puede eliminar (por diseño)
2. Esto protege el historial académico
3. Alternativa: Desinscribir alumnos y dejar el curso inactivo

---

### Problema: No aparecen alumnos para inscribir

**Causa:** Todos los alumnos ya están inscritos
**Solución:**
1. Verificar en tab "Inscritos"
2. Si es correcto, no hay problema
3. Si necesitas agregar más, crea nuevos alumnos

---

### Problema: Error al inscribir alumnos

**Causa:** Posible duplicado o error de red
**Solución:**
1. Verificar en tab "Inscritos" si se inscribieron
2. Intentar de nuevo
3. Si persiste, revisar consola del navegador

---

## Próximas Mejoras Sugeridas

### Prioridad Alta 🔴

- [ ] **Importación Masiva:** CSV con inscripciones
- [ ] **Exportar Lista:** Descargar alumnos del curso
- [ ] **Filtros Avanzados:** Por grado, grupo, maestro

### Prioridad Media 🟡

- [ ] **Historial de Cambios:** Log de inscripciones/desinscripciones
- [ ] **Capacidad Máxima:** Límite de alumnos por curso
- [ ] **Asignación Automática:** Por grado/grupo

### Prioridad Baja 🟢

- [ ] **Estadísticas:** Alumnos por curso, promedio de inscripciones
- [ ] **Notificaciones:** Avisar a maestros de nuevas inscripciones
- [ ] **Horarios:** Asignar horarios a cursos

---

## Changelog

### v1.0.0 - Sistema de Gestión de Cursos (19/10/2025)

**Agregado:**
- ✅ CRUD completo de cursos
- ✅ Inscripción masiva de alumnos con checkboxes
- ✅ Desinscripción individual
- ✅ Vista de alumnos disponibles vs inscritos
- ✅ Búsqueda en tiempo real
- ✅ Validaciones de maestros activos
- ✅ Protección contra eliminación con tareas
- ✅ Interfaz con tabs
- ✅ Componente Checkbox creado
- ✅ Server Actions completas
- ✅ Documentación completa

---

## Estadísticas del Sistema

**Archivos creados:** 5
**Server Actions:** 9
**Componentes UI:** 4 (FormularioCurso, ListaCursos, DialogoInscribirAlumnos, DialogoEditarCurso)
**Líneas de código:** ~1,500

---

**Documentación creada el:** 19 de Octubre, 2025
**Última actualización:** 19 de Octubre, 2025
**Versión del Sistema:** 1.0.0
