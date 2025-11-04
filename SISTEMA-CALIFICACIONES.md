# Sistema de Calificaciones - Documentación Completa

**Fecha:** 19 de Octubre, 2025
**Estado:** ✅ Implementado y Funcional

---

## Índice

1. [Descripción General](#descripción-general)
2. [Funcionalidades por Rol](#funcionalidades-por-rol)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Vistas Implementadas](#vistas-implementadas)
5. [Flujo de Calificación](#flujo-de-calificación)
6. [Cálculo de Promedios](#cálculo-de-promedios)
7. [Guía de Uso](#guía-de-uso)
8. [Archivos del Sistema](#archivos-del-sistema)

---

## Descripción General

El sistema de calificaciones permite a maestros calificar las entregas de tareas de los alumnos, proporcionar retroalimentación, y a los alumnos y padres consultar las calificaciones obtenidas por curso y en general.

### Características Principales

- ✅ Calificación de entregas por maestros
- ✅ Retroalimentación personalizada por tarea
- ✅ Vista detallada de calificaciones por curso (Alumnos)
- ✅ Vista de calificaciones para padres con selector de hijos
- ✅ Cálculo automático de promedios por curso
- ✅ Cálculo automático de promedio general
- ✅ Estadísticas de rendimiento
- ✅ Badges de rendimiento por porcentaje
- ✅ Interfaz responsiva y amigable

---

## Funcionalidades por Rol

### 👨‍🏫 Maestros

**Archivo:** `app/maestro/tarea/[id]/entregas/page.tsx`

#### Pueden:
- Ver todas las entregas de una tarea específica
- Calificar entregas entregadas
- Editar calificaciones ya asignadas
- Proporcionar retroalimentación escrita
- Ver estadísticas de la tarea:
  - Total de alumnos
  - Entregas pendientes
  - Entregas por calificar
  - Entregas calificadas
  - Promedio del grupo

#### Interfaz de Calificación:
```
┌─────────────────────────────────┐
│ Calificación (0-100)            │
│ [________]                      │
│                                 │
│ Retroalimentación              │
│ [____________________]         │
│                                 │
│ [Guardar] [Cancelar]           │
└─────────────────────────────────┘
```

#### Validaciones:
- La calificación debe estar entre 0 y el puntaje máximo de la tarea
- Al guardar, el status cambia automáticamente a "calificada"

---

### 👨‍🎓 Alumnos

**Archivo:** `app/alumno/calificaciones/page.tsx`

#### Pueden:
- Ver todas sus calificaciones organizadas por curso
- Ver promedio por curso
- Ver promedio general
- Ver retroalimentación del maestro
- Ver estadísticas:
  - Promedio general
  - Número de cursos
  - Tareas calificadas
  - Total de tareas

#### Información Mostrada:
Para cada tarea:
- ✅ Nombre de la tarea
- ✅ Fecha de vencimiento
- ✅ Fecha de entrega
- ✅ Calificación obtenida (ej: 85/100)
- ✅ Porcentaje (ej: 85%)
- ✅ Badge de rendimiento (color según porcentaje)
- ✅ Estado (Calificada/Entregada/Pendiente)
- ✅ Retroalimentación del maestro

#### Acceso:
- Desde el dashboard: Click en la tarjeta de "Promedio"
- URL directa: `/alumno/calificaciones`

---

### 👨‍👩‍👧 Padres

**Archivo:** `app/padre/calificaciones/page.tsx`

#### Pueden:
- Seleccionar entre múltiples hijos (si tienen más de uno)
- Ver todas las calificaciones del hijo seleccionado
- Ver la misma información que los alumnos
- Monitorear el rendimiento académico
- Ver retroalimentación de los maestros

#### Características Especiales:
- **Selector de Hijos:** Dropdown para cambiar entre hijos
- **Información del Hijo:** Muestra matrícula, grado y grupo
- **Mismas Estadísticas:** Promedio general, cursos, tareas

#### Acceso:
- Desde el dashboard: Click en la tarjeta de "Calificaciones"
- URL directa: `/padre/calificaciones`

---

## Estructura de Base de Datos

### Tabla: `entregas`

```sql
CREATE TABLE entregas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID REFERENCES tareas(id) ON DELETE CASCADE,
  alumno_id UUID REFERENCES alumnos(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pendiente', 'entregada', 'calificada')),
  calificacion NUMERIC,
  retroalimentacion TEXT,
  fecha_entrega TIMESTAMP,
  archivo_url TEXT,
  comentarios TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Campos Importantes:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `status` | TEXT | Estado de la entrega (pendiente/entregada/calificada) |
| `calificacion` | NUMERIC | Puntos obtenidos por el alumno |
| `retroalimentacion` | TEXT | Comentarios del maestro sobre la entrega |
| `fecha_entrega` | TIMESTAMP | Fecha en que el alumno entregó la tarea |

### Tabla: `tareas`

```sql
CREATE TABLE tareas (
  id UUID PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_vencimiento TIMESTAMP,
  curso_id UUID REFERENCES cursos(id),
  maestro_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Campo Importante:

---

## Vistas Implementadas

### 1. Vista de Entregas para Maestros

**Ruta:** `/maestro/tarea/[id]/entregas`

**Características:**
- Lista de todas las entregas de la tarea
- Estadísticas en tiempo real
- Formulario inline para calificar
- Filtros visuales por estado (badges de colores)

**Estadísticas Mostradas:**
```
┌──────┬──────────────┬─────────────┬──────────────┬──────────┐
│ Total│ Por Calificar│ Calificadas │ No Entregadas│ Promedio │
├──────┼──────────────┼─────────────┼──────────────┼──────────┤
│  30  │      5       │     20      │      5       │   8.5    │
└──────┴──────────────┴─────────────┴──────────────┴──────────┘
```

---

### 2. Vista de Calificaciones para Alumnos

**Ruta:** `/alumno/calificaciones`

**Características:**
- Organización por curso
- Tabla detallada por tarea
- Promedio por curso
- Promedio general
- Badges de rendimiento con colores

**Colores de Badges:**
- 🟢 Verde (default): ≥ 90%
- 🟡 Amarillo (secondary): 70-89%
- 🔴 Rojo (destructive): < 70%

---

### 3. Vista de Calificaciones para Padres

**Ruta:** `/padre/calificaciones`

**Características:**
- Selector de hijos (dropdown)
- Información del hijo seleccionado
- Misma vista de calificaciones que alumnos
- Tarjeta destacada con info del hijo

---

## Flujo de Calificación

### Proceso Completo:

```
1. Alumno entrega tarea
   └─> Status: "entregada"

2. Maestro accede a entregas
   └─> URL: /maestro/tarea/[id]/entregas

3. Maestro califica la entrega
   ├─> Ingresa calificación
   ├─> Escribe retroalimentación (opcional)
   └─> Guarda

4. Sistema actualiza
   ├─> calificacion: [valor]
   ├─> retroalimentacion: [texto]
   └─> status: "calificada"

5. Alumno/Padre puede ver
   ├─> Calificación
   ├─> Porcentaje
   ├─> Retroalimentación
   └─> Promedio actualizado
```

---

## Cálculo de Promedios

### Promedio por Curso

```javascript
const promedio = tareasCalificadas.length > 0
  ? tareasCalificadas.reduce((sum, t) => {
      const entrega = t.entregas.find(e => e.id)
      return sum + (entrega?.calificacion || 0)
    }, 0) / tareasCalificadas.length
  : 0
```

**Fórmula:**
```
Promedio Curso = Suma de Calificaciones / Número de Tareas Calificadas
```

### Promedio General

```javascript
const promedioGeneral = totalCalificaciones > 0
  ? calificacionesPorCurso.reduce((sum, c) =>
      sum + (c.promedio * c.tareasCalificadas), 0
    ) / totalCalificaciones
  : 0
```

**Fórmula:**
```
Promedio General = (Σ(Promedio_Curso × Tareas_Calificadas)) / Total_Calificaciones
```

**Nota:** El promedio general es un promedio ponderado, donde cada tarea tiene el mismo peso.

---

## Guía de Uso

### Para Maestros

#### Calificar una Tarea:

1. Ir al dashboard de maestro
2. Navegar a la tarea deseada
3. Click en "Ver Entregas"
4. Para cada entrega:
   - Click en "Calificar" (o "Editar" si ya está calificada)
   - Ingresar calificación
   - Escribir retroalimentación (opcional pero recomendado)
   - Click en "Guardar"

#### Mejores Prácticas:

- ✅ Siempre proporcionar retroalimentación constructiva
- ✅ Calificar dentro de las primeras 48 horas
- ✅ Ser consistente con los criterios de evaluación
- ✅ Usar el rango completo de puntos (0 a máximo)

---

### Para Alumnos

#### Consultar Calificaciones:

1. Ir al dashboard
2. Click en la tarjeta "Promedio" (con icono de trofeo)
3. Ver calificaciones organizadas por curso
4. Leer retroalimentación de los maestros

#### Interpretación de Badges:

| Badge | Color | Significado |
|-------|-------|-------------|
| 90-100% | Verde | Excelente |
| 70-89% | Amarillo | Satisfactorio |
| < 70% | Rojo | Necesita mejorar |

---

### Para Padres

#### Monitorear Rendimiento:

1. Ir al dashboard
2. Click en "Ver Boleta" o "Calificaciones"
3. Seleccionar hijo (si tiene varios)
4. Revisar:
   - Promedio general
   - Promedio por curso
   - Tareas pendientes de calificar
   - Retroalimentación de maestros

#### Acciones Recomendadas:

- 📊 Revisar semanalmente
- 💬 Leer retroalimentación de maestros
- 🎯 Identificar áreas de oportunidad
- 🤝 Comunicarse con maestros si es necesario

---

## Archivos del Sistema

### Componentes Principales:

```
app/
├── maestro/
│   └── tarea/
│       └── [id]/
│           └── entregas/
│               └── page.tsx           # Vista de entregas y calificación
├── alumno/
│   ├── page.tsx                       # Dashboard con promedio
│   └── calificaciones/
│       └── page.tsx                   # Vista detallada de calificaciones
└── padre/
    ├── page.tsx                       # Dashboard con enlace a calificaciones
    └── calificaciones/
        └── page.tsx                   # Vista de calificaciones de hijos
```

### Dependencias UI:

- `components/ui/card.tsx` - Tarjetas
- `components/ui/table.tsx` - Tablas de calificaciones
- `components/ui/badge.tsx` - Badges de estado y rendimiento
- `components/ui/button.tsx` - Botones de acción
- `components/ui/input.tsx` - Campos de calificación
- `components/ui/select.tsx` - Selector de hijos (padres)

---

## Estadísticas del Sistema

### Métricas Disponibles:

#### Para Maestros (por tarea):
- ✅ Total de alumnos
- ✅ Entregas pendientes
- ✅ Entregas por calificar
- ✅ Entregas calificadas
- ✅ Promedio del grupo

#### Para Alumnos:
- ✅ Promedio general
- ✅ Número de cursos
- ✅ Tareas calificadas
- ✅ Total de tareas
- ✅ Promedio por curso

#### Para Padres:
- ✅ Mismas que alumnos
- ✅ Selector de múltiples hijos
- ✅ Información del hijo seleccionado

---

## Próximas Mejoras Sugeridas

### Prioridad Alta 🔴

- [ ] **Exportación de Boletas:** PDF descargable
- [ ] **Historial de Calificaciones:** Por periodos/semestres
- [ ] **Gráficas de Rendimiento:** Visualización de progreso

### Prioridad Media 🟡

- [ ] **Criterios de Evaluación:** Rúbricas por tarea
- [ ] **Comentarios de Alumnos:** Respuesta a retroalimentación
- [ ] **Notificaciones:** Alertar cuando se califica una tarea

### Prioridad Baja 🟢

- [ ] **Comparativa de Grupo:** Percentiles
- [ ] **Metas de Aprendizaje:** Tracking de objetivos
- [ ] **Análisis Predictivo:** IA para identificar riesgos

---

## Validaciones y Reglas de Negocio

### Restricciones:

1. **Calificación:**
   - Debe ser numérica
   - No puede ser negativa

2. **Estado:**
   - Solo se puede calificar si status es "entregada"
   - Al calificar, status cambia automáticamente a "calificada"

3. **Permisos:**
   - Solo maestros pueden calificar
   - Solo pueden calificar tareas de sus cursos
   - Alumnos/Padres solo ven (read-only)

4. **Retroalimentación:**
   - Opcional pero altamente recomendada
   - Visible para alumno y padre
   - Editable por el maestro

---

## Troubleshooting

### Problemas Comunes:

#### No aparecen calificaciones

**Causa:** No hay entregas calificadas
**Solución:** Esperar a que el maestro califique

#### Promedio en 0

**Causa:** Ninguna tarea calificada aún
**Solución:** Normal si es inicio de periodo

#### No se puede calificar

**Causa:** La entrega está como "pendiente"
**Solución:** Esperar a que el alumno entregue primero



---

## Changelog

### v1.0.0 - Sistema de Calificaciones (19/10/2025)

**Agregado:**
- ✅ Vista de calificaciones para alumnos
- ✅ Vista de calificaciones para padres
- ✅ Selector de hijos para padres
- ✅ Cálculo de promedios por curso
- ✅ Cálculo de promedio general
- ✅ Badges de rendimiento con colores
- ✅ Estadísticas detalladas
- ✅ Enlaces en dashboards
- ✅ Documentación completa

**Mejorado:**
- ✅ Vista de entregas para maestros (ya existente)
- ✅ Interfaz de calificación inline
- ✅ Retroalimentación visible para alumnos/padres

---

## Contacto y Soporte

Para reportar bugs o sugerir mejoras al sistema de calificaciones:
- Revisar esta documentación primero
- Verificar permisos de usuario
- Consultar logs del servidor
- Reportar con capturas de pantalla

---

**Documentación creada el:** 19 de Octubre, 2025
**Última actualización:** 19 de Octubre, 2025
**Versión del Sistema:** 1.0.0
