# 📊 Estado Actual del Sistema Escolar

**Última actualización:** 15 de Enero, 2025
**Versión:** 2.0
**Estado:** ✅ Operativo

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Usuarios y Roles](#usuarios-y-roles)
3. [Funcionalidades por Rol](#funcionalidades-por-rol)
4. [Estructura de Base de Datos](#estructura-de-base-de-datos)
5. [Funcionalidades Principales](#funcionalidades-principales)
6. [Últimas Implementaciones](#últimas-implementaciones)
7. [Integraciones Externas](#integraciones-externas)
8. [Archivos Principales](#archivos-principales)
9. [Pendientes y Mejoras Futuras](#pendientes-y-mejoras-futuras)

---

## 🎯 Descripción General

Sistema de gestión escolar integral que incluye:
- Gestión de usuarios (directivo, maestros, alumnos, padres, auxiliar de calificaciones)
- Sistema de cursos e inscripciones
- Gestión de tareas con archivos adjuntos
- Sistema de calificación binario (Entregado/No Entregado)
- Sistema de pagos con integración de Mercado Pago
- Generación y distribución de boletas en PDF
- Relaciones padre-alumno para seguimiento académico

**Tecnologías:**
- Next.js 14 (App Router)
- Supabase (PostgreSQL + Auth + Storage)
- TypeScript
- Tailwind CSS
- Mercado Pago API

---

## 👥 Usuarios y Roles

### Roles Implementados:

| Rol | Código | Permisos | Estado |
|-----|--------|----------|--------|
| **Directivo** | `directivo` | Acceso total: gestión de usuarios, cursos, pagos, boletas | ✅ Implementado |
| **Maestro** | `maestro` | Gestión de tareas, calificaciones, entregas de alumnos | ✅ Implementado |
| **Alumno** | `alumno` | Ver cursos, entregar tareas, ver calificaciones, pagar | ✅ Implementado |
| **Padre** | `padre` | Ver calificaciones de hijos, realizar pagos, descargar boletas | ✅ Implementado |
| **Auxiliar Calificaciones** | `auxiliar_calificaciones` | Calificar tareas (sin acceso a datos de contacto) | ✅ Implementado |

---

## 🔐 Funcionalidades por Rol

### 🎓 **Directivo**

#### Gestión de Usuarios
- ✅ Crear, editar, activar/desactivar alumnos
- ✅ Crear, editar, activar/desactivar maestros
- ✅ Crear, editar auxiliares de calificaciones
- ✅ Gestión de padres
- ✅ Ver matrícula completa

#### Gestión de Cursos
- ✅ Crear cursos (nombre, descripción, grado, grupo)
- ✅ Asignar maestro a curso
- ✅ Inscribir alumnos a cursos
- ✅ Asignación automática de cursos por grado/grupo

#### Gestión de Pagos
- ✅ Crear pagos individuales por alumno
- ✅ Crear pagos masivos por grado/grupo/todos
- ✅ Ver estado de pagos (pendiente/pagado/vencido)
- ✅ Ver detalle de pago con información del pagador

#### Gestión de Boletas
- ✅ Subir boletas en PDF por alumno
- ✅ Boletas por periodo y ciclo escolar
- ✅ Agregar notas a las boletas

#### Relaciones Padre-Alumno
- ✅ Ver todas las relaciones padre-alumno
- ✅ Asignar alumnos a padres
- ✅ Ver padres sin alumnos asignados
- ✅ Ver alumnos sin padre asignado
- ✅ Eliminar relaciones
- ✅ Migración de usuarios padre existentes

**Rutas:**
- `/directivo` - Dashboard
- `/directivo/usuarios` - Gestión de usuarios
- `/directivo/cursos` - Gestión de cursos
- `/directivo/pagos` - Gestión de pagos
- `/directivo/boletas` - Gestión de boletas
- `/directivo/relaciones-padre-alumno` - Gestión de relaciones

---

### 👨‍🏫 **Maestro**

#### Gestión de Tareas
- ✅ Crear tareas con:
  - Título
  - Descripción
  - Fecha de entrega
  - **Archivo adjunto (PDF, DOC, imágenes)** 🆕
- ✅ Ver tareas creadas
- ✅ Editar tareas

#### Calificación de Entregas
- ✅ Ver entregas de alumnos por tarea
- ✅ Descargar archivos entregados por alumnos
- ✅ **Calificar con sistema binario:**
  - "Entregado" ✅
  - "No Entregado" ❌
- ✅ Agregar retroalimentación personalizada
- ✅ Editar calificaciones ya asignadas
- ✅ Estadísticas por tarea:
  - Total de alumnos
  - Entregas pendientes
  - Entregas por calificar
  - Entregas calificadas

**Rutas:**
- `/maestro` - Dashboard con cursos asignados
- `/maestro/crear-tarea` - Crear nueva tarea
- `/maestro/tarea/[id]/entregas` - Ver y calificar entregas

---

### 👨‍🎓 **Alumno**

#### Ver Cursos
- ✅ Ver cursos inscritos
- ✅ Ver información del maestro

#### Tareas
- ✅ Ver tareas asignadas
- ✅ Ver descripción y fecha de entrega
- ✅ **Descargar archivos adjuntos del maestro** 🆕
- ✅ Subir archivo de tarea
- ✅ Agregar comentarios opcionales
- ✅ Actualizar entrega antes de ser calificada
- ✅ Ver estado: Pendiente/Entregada/Calificada
- ✅ **Ver calificación binaria (Entregado/No Entregado)** 🆕
- ✅ Ver retroalimentación del maestro

#### Calificaciones
- ✅ Ver boletas en PDF por periodo
- ✅ Descargar boletas oficiales

#### Pagos
- ✅ Ver pagos pendientes
- ✅ Ver pagos pagados
- ✅ Pagar con Mercado Pago
- ✅ Pago manual (efectivo, transferencia)
- ✅ Ver comprobantes de pago

**Rutas:**
- `/alumno` - Dashboard
- `/alumno/tarea/[id]` - Ver detalle de tarea y entregar
- `/alumno/calificaciones` - Ver boletas
- `/alumno/pagos` - Gestión de pagos

---

### 👨‍👩‍👧 **Padre**

#### Calificaciones de Hijos
- ✅ Selector de hijos (si tiene múltiples)
- ✅ Ver boletas de calificaciones por hijo
- ✅ Descargar boletas en PDF
- ✅ Ver información académica (grado, grupo, matrícula)

#### Pagos
- ✅ Selector de hijos para pagos
- ✅ Ver pagos pendientes por hijo
- ✅ Ver pagos pagados
- ✅ Pagar con Mercado Pago
- ✅ Pago manual (efectivo, transferencia)
- ✅ Ver historial de pagos

**Rutas:**
- `/padre` - Dashboard
- `/padre/calificaciones` - Ver boletas de hijos
- `/padre/pagos` - Gestión de pagos de hijos

---

### 🔧 **Auxiliar de Calificaciones**

- ✅ Ver entregas de tareas (solo nombres, sin datos de contacto)
- ✅ Calificar entregas con sistema binario
- ✅ Agregar retroalimentación
- ✅ Sin acceso a matrículas o información sensible
- ✅ Vista restringida para protección de datos

**Rutas:**
- `/auxiliar` - Dashboard con tareas asignadas
- `/auxiliar/tarea/[id]/entregas` - Ver y calificar entregas

---

## 🗄️ Estructura de Base de Datos

### Tablas Principales:

#### **profiles**
```sql
- id (UUID, PK) - Referencia a auth.users
- nombre (TEXT)
- apellidos (TEXT)
- email (TEXT)
- role (TEXT) - directivo/maestro/alumno/padre/auxiliar_calificaciones
- activo (BOOLEAN)
- created_at (TIMESTAMP)
```

#### **alumnos**
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles.id)
- matricula (TEXT, UNIQUE)
- grado (TEXT)
- grupo (TEXT)
- activo (BOOLEAN)
- created_at (TIMESTAMP)
```

#### **maestros**
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles.id)
- especialidad (TEXT)
- activo (BOOLEAN)
- created_at (TIMESTAMP)
```

#### **padres**
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles.id)
- telefono (TEXT)
- created_at (TIMESTAMP)
```

#### **padre_alumno**
```sql
- id (UUID, PK)
- padre_id (UUID, FK → padres.id)
- alumno_id (UUID, FK → alumnos.id)
- parentesco (TEXT) - Padre/Madre/Tutor/etc.
- created_at (TIMESTAMP)
```

#### **cursos**
```sql
- id (UUID, PK)
- nombre (TEXT)
- descripcion (TEXT)
- grado (TEXT)
- grupo (TEXT)
- maestro_id (UUID, FK → profiles.id)
- activo (BOOLEAN)
- created_at (TIMESTAMP)
```

#### **inscripciones**
```sql
- id (UUID, PK)
- alumno_id (UUID, FK → alumnos.id)
- curso_id (UUID, FK → cursos.id)
- created_at (TIMESTAMP)
```

#### **tareas**
```sql
- id (UUID, PK)
- curso_id (UUID, FK → cursos.id)
- titulo (TEXT)
- descripcion (TEXT)
- fecha_entrega (TIMESTAMP)
- archivo_url (TEXT) 🆕 - URL del archivo adjunto del maestro
- created_at (TIMESTAMP)
```

#### **entregas**
```sql
- id (UUID, PK)
- tarea_id (UUID, FK → tareas.id)
- alumno_id (UUID, FK → alumnos.id)
- status (TEXT) - pendiente/entregada/calificada
- calificacion (TEXT) 🆕 - "Entregado" o "No Entregado"
- retroalimentacion (TEXT)
- archivo_url (TEXT) - URL del archivo del alumno
- comentarios (TEXT)
- fecha_entrega (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### **pagos**
```sql
- id (UUID, PK)
- alumno_id (UUID, FK → alumnos.id)
- concepto (TEXT)
- descripcion (TEXT)
- monto (NUMERIC)
- fecha_limite (DATE)
- status (TEXT) - pendiente/pagado/vencido
- metodo_pago (TEXT) - mercadopago/efectivo/transferencia
- comprobante_url (TEXT)
- mercadopago_preference_id (TEXT)
- mercadopago_payment_id (TEXT)
- pagado_por_padre_id (UUID, FK → padres.id)
- pagado_por_nombre (TEXT)
- fecha_pago (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### **boletas**
```sql
- id (UUID, PK)
- alumno_id (UUID, FK → alumnos.id)
- periodo (TEXT) - 1er Bimestre, 2do Bimestre, etc.
- ciclo_escolar (TEXT) - 2024-2025
- archivo_url (TEXT)
- archivo_nombre (TEXT)
- notas (TEXT)
- subido_por (UUID, FK → profiles.id)
- fecha_subida (TIMESTAMP)
```

---

## ⚙️ Funcionalidades Principales

### 1. **Sistema de Autenticación**
- ✅ Login con email y contraseña (Supabase Auth)
- ✅ Registro de nuevos usuarios (solo por directivo)
- ✅ Roles y permisos
- ✅ Redirección automática según rol
- ✅ Protección de rutas con middleware

### 2. **Sistema de Cursos e Inscripciones**
- ✅ Creación de cursos por directivo
- ✅ Asignación de maestros a cursos
- ✅ Inscripción manual de alumnos
- ✅ Inscripción automática por grado/grupo
- ✅ Vista de cursos para alumnos
- ✅ Vista de cursos asignados para maestros

### 3. **Sistema de Tareas y Entregas** 🆕 **Actualizado**
- ✅ Maestros crean tareas
- ✅ **Maestros adjuntan archivos (PDFs, documentos, imágenes)**
- ✅ **Alumnos descargan archivos del maestro**
- ✅ Alumnos suben archivos de entrega
- ✅ Alumnos agregan comentarios
- ✅ **Sistema de calificación binario:**
  - "Entregado" ✅
  - "No Entregado" ❌
- ✅ Retroalimentación personalizada del maestro
- ✅ Actualización de entregas antes de calificar
- ✅ Estadísticas por tarea

### 4. **Sistema de Pagos con Mercado Pago**
- ✅ Integración con Mercado Pago API
- ✅ Creación de pagos individuales
- ✅ Creación de pagos masivos (por grado/grupo/todos)
- ✅ Generación de preferencias de pago
- ✅ Webhook para recibir notificaciones de pago
- ✅ Actualización automática de estado de pago
- ✅ Registro de quién pagó (padre o alumno)
- ✅ Métodos de pago alternativos:
  - Efectivo
  - Transferencia
  - Depósito
- ✅ Subida de comprobantes de pago manual

### 5. **Sistema de Boletas**
- ✅ Subida de boletas en PDF por alumno
- ✅ Organización por periodo y ciclo escolar
- ✅ Notas opcionales por boleta
- ✅ Descarga de boletas para alumnos
- ✅ Descarga de boletas para padres (selector de hijos)
- ✅ Storage en Supabase

### 6. **Sistema de Relaciones Padre-Alumno**
- ✅ Tabla intermedia `padre_alumno`
- ✅ Un padre puede tener múltiples hijos
- ✅ Un alumno puede tener múltiples padres/tutores
- ✅ Tipo de parentesco configurable
- ✅ Gestión completa desde dashboard de directivo:
  - Ver todas las relaciones
  - Crear nuevas relaciones
  - Eliminar relaciones
  - Ver padres sin alumnos
  - Ver alumnos sin padre
- ✅ Migración de padres existentes

---

## 🆕 Últimas Implementaciones (15 de Enero, 2025)

### 1. **Archivos Adjuntos en Tareas**
- Maestros pueden subir archivos al crear tareas
- Formatos soportados: PDF, DOC, DOCX, TXT, JPG, PNG
- Almacenamiento en Supabase Storage (bucket `tareas`)
- Alumnos pueden descargar antes de entregar

**Archivos modificados:**
- `app/maestro/crear-tarea/page.tsx`
- `app/alumno/tarea/[id]/page.tsx`

**Migración aplicada:**
```sql
ALTER TABLE tareas ADD COLUMN archivo_url TEXT;
```

### 2. **Sistema de Calificación Binario**
- Cambio de calificación numérica (0-100) a binaria
- Opciones: "Entregado" / "No Entregado"
- Simplifica el proceso de calificación
- Conversión automática de calificaciones existentes:
  - ≥ 70 → "Entregado"
  - < 70 → "No Entregado"

**Archivos modificados:**
- `app/maestro/tarea/[id]/entregas/page.tsx`
- `app/alumno/tarea/[id]/page.tsx`
- `app/alumno/page.tsx`

**Migración aplicada:**
```sql
ALTER TABLE entregas ALTER COLUMN calificacion TYPE TEXT;
ALTER TABLE entregas ADD CONSTRAINT entregas_calificacion_check
  CHECK (calificacion IS NULL OR calificacion IN ('Entregado', 'No Entregado'));
```

---

## 🔌 Integraciones Externas

### Mercado Pago
- **Configuración:** `lib/mercadopago.ts`
- **Access Token:** Guardado en variables de entorno
- **Webhook URL:** `/api/webhooks/mercadopago`
- **Funcionalidades:**
  - Creación de preferencias de pago
  - Recepción de notificaciones
  - Actualización automática de estados

**Variables de entorno necesarias:**
```env
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_public_key
MERCADOPAGO_ACCESS_TOKEN=tu_access_token
```

### Supabase
- **Auth:** Autenticación de usuarios
- **Database:** PostgreSQL
- **Storage:** Almacenamiento de archivos
  - Bucket `boletas` - PDFs de boletas
  - Bucket `tareas` - Archivos de tareas y entregas
  - Bucket `comprobantes` - Comprobantes de pago

**Variables de entorno necesarias:**
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

---

## 📁 Archivos Principales del Sistema

### Estructura del Proyecto:

```
sistema-escolar/
├── app/
│   ├── actions/
│   │   ├── boletas-actions.ts
│   │   ├── cursos-actions.ts
│   │   ├── pagos-actions.ts
│   │   ├── usuarios-actions.ts
│   │   ├── relaciones-padre-alumno-actions.ts
│   │   └── migrar-padres-actions.ts
│   │
│   ├── directivo/
│   │   ├── page.tsx
│   │   ├── usuarios/
│   │   ├── cursos/
│   │   ├── pagos/
│   │   ├── boletas/
│   │   └── relaciones-padre-alumno/
│   │
│   ├── maestro/
│   │   ├── page.tsx
│   │   ├── crear-tarea/
│   │   └── tarea/[id]/entregas/
│   │
│   ├── alumno/
│   │   ├── page.tsx
│   │   ├── tarea/[id]/
│   │   ├── calificaciones/
│   │   └── pagos/
│   │
│   ├── padre/
│   │   ├── page.tsx
│   │   ├── calificaciones/
│   │   └── pagos/
│   │
│   ├── auxiliar/
│   │   ├── page.tsx
│   │   └── tarea/[id]/entregas/
│   │
│   └── api/
│       └── webhooks/
│           └── mercadopago/
│
├── lib/
│   ├── supabase.ts
│   ├── supabase-server.ts
│   └── mercadopago.ts
│
├── components/
│   └── ui/
│
├── supabase/
│   └── migrations/
│       ├── 20250104_crear_sistema_pagos.sql
│       ├── 20250104_crear_tabla_padres_simple.sql
│       ├── 20250115_add_archivo_url_to_tareas.sql
│       └── 20250115_change_calificacion_to_binary.sql
│
└── scripts/
    └── migrar-padres.sql
```

### Archivos de Documentación:

```
📄 ESTADO_ACTUAL_SISTEMA.md - Este archivo
📄 SISTEMA-CALIFICACIONES.md - Documentación del sistema de calificaciones
📄 SISTEMA-BOLETAS-PDF.md - Documentación del sistema de boletas
📄 MERCADOPAGO_SETUP.md - Setup de Mercado Pago
📄 INSTRUCCIONES_MIGRACION.md - Instrucciones para aplicar migraciones
📄 APLICAR_MIGRACIONES.sql - SQL para aplicar migraciones
📄 ROL-AUXILIAR-CALIFICACIONES.md - Documentación del rol auxiliar
📄 AUTHENTICATION.md - Documentación de autenticación
```

---

## 📌 Pendientes y Mejoras Futuras

### Prioridad Alta 🔴

- [ ] **Exportación de Reportes**
  - Reportes de calificaciones en Excel
  - Reportes de pagos
  - Reportes de asistencia

- [ ] **Sistema de Asistencia**
  - Maestros pasan lista
  - Padres ven asistencia de hijos
  - Reportes de inasistencias

- [ ] **Notificaciones**
  - Email cuando se crea una tarea
  - Email cuando se califica
  - Email cuando hay un pago pendiente
  - Email cuando se sube una boleta

### Prioridad Media 🟡

- [ ] **Historial Académico**
  - Ver calificaciones de periodos anteriores
  - Gráficas de rendimiento
  - Comparativa entre periodos

- [ ] **Mensajería Interna**
  - Comunicación padre-maestro
  - Comunicación padre-directivo
  - Notificaciones en tiempo real

- [ ] **Sistema de Tareas Mejorado**
  - Fechas de inicio y fin
  - Tareas con múltiples entregas
  - Rúbricas de evaluación

### Prioridad Baja 🟢

- [ ] **Dashboard Mejorado**
  - Gráficas de rendimiento
  - Estadísticas generales
  - Análisis predictivo

- [ ] **Calendario Escolar**
  - Eventos escolares
  - Fechas importantes
  - Sincronización con Google Calendar

- [ ] **Modo Oscuro**
  - Tema claro/oscuro
  - Preferencias de usuario

---

## 🔧 Configuración Actual

### Variables de Entorno Requeridas:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Mercado Pago
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_ACCESS_TOKEN=
```

### Buckets de Supabase Storage:

| Bucket | Uso | Políticas |
|--------|-----|-----------|
| `boletas` | PDFs de boletas | Lectura: Alumnos y padres<br>Escritura: Directivo |
| `tareas` | Archivos de tareas y entregas | Lectura: Todos<br>Escritura: Maestros y alumnos |
| `comprobantes` | Comprobantes de pago | Lectura: Directivo<br>Escritura: Padres y alumnos |

---

## 📊 Estadísticas del Sistema

### Tablas en Base de Datos: **14**
- profiles
- alumnos
- maestros
- padres
- padre_alumno
- auxiliares_calificaciones
- cursos
- inscripciones
- tareas
- entregas
- pagos
- boletas
- (+ tablas de Supabase Auth)

### Roles de Usuario: **5**
- Directivo
- Maestro
- Alumno
- Padre
- Auxiliar de Calificaciones

### Módulos Principales: **7**
1. Autenticación y usuarios
2. Cursos e inscripciones
3. Tareas y entregas
4. Calificaciones
5. Pagos (Mercado Pago)
6. Boletas
7. Relaciones padre-alumno

---

## 🚀 Cómo Continuar el Desarrollo

### Para agregar nuevas funcionalidades:

1. **Revisar este documento** para entender qué está implementado
2. **Verificar la estructura de base de datos** en la sección correspondiente
3. **Crear migración SQL** si se requieren cambios en la BD
4. **Implementar la funcionalidad** siguiendo la estructura existente
5. **Actualizar este documento** con los cambios realizados

### Estructura de una nueva funcionalidad:

1. **Crear action** en `app/actions/`
2. **Crear componente de UI** en la carpeta del rol correspondiente
3. **Actualizar el dashboard** del rol si es necesario
4. **Agregar rutas** si se crean nuevas páginas
5. **Documentar** en este archivo

---

## 📝 Notas Importantes

### Seguridad:
- ✅ RLS (Row Level Security) habilitado en Supabase
- ✅ Middleware protege rutas según rol
- ✅ Auxiliar de calificaciones tiene acceso restringido (sin datos de contacto)
- ✅ Validación de permisos en server actions

### Performance:
- ✅ Queries optimizadas con select específicos
- ✅ Paginación pendiente para listas grandes
- ✅ Storage optimizado con buckets separados

### Datos de Prueba:
- Ver archivo: `DATOS-PRUEBA.md`
- Scripts de seed: `scripts/seed-database.ts`

---

**Mantenido por:** Sistema de IA Claude
**Última revisión:** 15 de Enero, 2025
**Próxima actualización:** Cuando se implementen nuevas funcionalidades

---

## ✅ Checklist de Verificación del Sistema

Usa esto para verificar que todo funciona correctamente:

### Autenticación:
- [ ] Login funciona para todos los roles
- [ ] Redirección correcta según rol
- [ ] Logout funciona correctamente

### Directivo:
- [ ] Puede crear usuarios de todos los tipos
- [ ] Puede crear cursos
- [ ] Puede inscribir alumnos
- [ ] Puede crear pagos
- [ ] Puede subir boletas
- [ ] Puede gestionar relaciones padre-alumno

### Maestro:
- [ ] Puede crear tareas con archivos adjuntos
- [ ] Puede ver entregas de alumnos
- [ ] Puede calificar con sistema binario
- [ ] Puede agregar retroalimentación

### Alumno:
- [ ] Puede ver sus cursos
- [ ] Puede descargar archivos de tareas
- [ ] Puede entregar tareas
- [ ] Puede ver calificaciones
- [ ] Puede descargar boletas
- [ ] Puede pagar con Mercado Pago

### Padre:
- [ ] Puede seleccionar entre hijos
- [ ] Puede ver boletas de hijos
- [ ] Puede pagar por sus hijos
- [ ] Puede ver historial de pagos

### Integraciones:
- [ ] Mercado Pago genera preferencias correctamente
- [ ] Webhook recibe notificaciones
- [ ] Supabase Storage almacena archivos
- [ ] Emails de Supabase Auth funcionan

---

**FIN DEL DOCUMENTO**
