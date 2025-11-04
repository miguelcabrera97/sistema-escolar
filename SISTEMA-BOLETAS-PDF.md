# Sistema de Boletas de Calificaciones en PDF

## Descripción General

El sistema de boletas reemplaza los cálculos internos de promedios por la **subida y distribución de boletas oficiales en PDF** procesadas externamente por la escuela. Los directivos suben las boletas por periodo/ciclo escolar, y los alumnos/padres las descargan desde su portal.

## Arquitectura del Sistema

### Base de Datos

**Tabla: `boletas`**
```sql
CREATE TABLE boletas (
  id UUID PRIMARY KEY,
  alumno_id UUID REFERENCES alumnos(id),
  periodo VARCHAR(50),              -- Ej: "2024-1", "Enero-Junio"
  ciclo_escolar VARCHAR(50),        -- Ej: "2024-2025"
  archivo_url TEXT,                 -- URL del PDF en Supabase Storage
  archivo_nombre TEXT,              -- Nombre original del archivo
  fecha_subida TIMESTAMP,
  subido_por UUID REFERENCES profiles(id),
  notas TEXT,                       -- Notas opcionales del directivo
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(alumno_id, periodo, ciclo_escolar)
);
```

**Características:**
- ✅ Solo una boleta por alumno/periodo/ciclo (restricción UNIQUE)
- ✅ Elimina automáticamente con CASCADE si se borra el alumno
- ✅ Índices optimizados para consultas rápidas
- ✅ Row Level Security (RLS) habilitada

### Supabase Storage

**Bucket: `boletas`**
- Almacena archivos PDF de boletas
- Organización: `{alumno_id}/{nombre_archivo}.pdf`
- Políticas de acceso configuradas
- Límite de tamaño: 10 MB por archivo

**Estructura de carpetas:**
```
boletas/
├── {alumno_id_1}/
│   ├── boleta_2024-1.pdf
│   └── boleta_2024-2.pdf
├── {alumno_id_2}/
│   └── boleta_2024-1.pdf
...
```

## Roles y Permisos

### Directivo
✅ **Puede:**
- Subir boletas para cualquier alumno
- Ver todas las boletas del sistema
- Actualizar/reemplazar boletas existentes
- Eliminar boletas
- Ver estadísticas de boletas subidas

❌ **No puede:**
- N/A (acceso completo al módulo)

### Alumno
✅ **Puede:**
- Ver sus propias boletas
- Descargar PDFs de sus boletas
- Ver información del periodo/ciclo

❌ **No puede:**
- Ver boletas de otros alumnos
- Subir o eliminar boletas
- Editar información de boletas

### Padre
✅ **Puede:**
- Ver boletas de todos sus hijos
- Descargar PDFs de boletas de sus hijos
- Cambiar entre hijos para ver sus boletas

❌ **No puede:**
- Ver boletas de alumnos que no son sus hijos
- Subir o eliminar boletas
- Editar información de boletas

### Maestro
❌ **No tiene acceso** al módulo de boletas
- Los maestros siguen usando el sistema de calificación de tareas
- No ven ni descargan boletas finales

### Auxiliar de Calificaciones
❌ **No tiene acceso** al módulo de boletas
- Continúa con funciones de calificación de entregas
- No tiene acceso a boletas finales

## Flujos de Trabajo

### 1. Directivo Sube Boleta

```
1. Directivo → /directivo/boletas
2. Completa formulario:
   - Selecciona alumno
   - Ingresa periodo (ej: "2024-1")
   - Ingresa ciclo escolar (ej: "2024-2025")
   - Sube archivo PDF (máx 10MB)
   - Agrega notas opcionales
3. Click "Subir Boleta"
4. Sistema valida archivo (debe ser PDF)
5. Si existe boleta previa para ese periodo:
   - Elimina PDF anterior del storage
   - Actualiza registro en BD
6. Si no existe:
   - Crea nuevo registro
7. Sube PDF a Supabase Storage
8. Guarda URL en base de datos
9. ✅ Boleta disponible para alumno/padre
```

### 2. Alumno Consulta Boletas

```
1. Alumno → /alumno/calificaciones
2. Sistema carga boletas del alumno
3. Muestra lista de periodos disponibles
4. Alumno hace click en "Descargar PDF"
5. PDF se abre en nueva pestaña
6. Alumno puede guardar/imprimir
```

### 3. Padre Consulta Boletas de Hijos

```
1. Padre → /padre/calificaciones
2. Sistema carga lista de hijos
3. Padre selecciona hijo del dropdown
4. Sistema carga boletas del hijo seleccionado
5. Muestra lista de periodos disponibles
6. Padre hace click en "Descargar PDF"
7. PDF se abre en nueva pestaña
```

## Componentes del Sistema

### Server Actions

**Archivo:** `app/actions/boletas-actions.ts`

**Funciones disponibles:**

1. **`subirBoleta(formData)`**
   - Valida que el usuario sea directivo
   - Valida que el archivo sea PDF (máx 10MB)
   - Sube archivo a Supabase Storage
   - Crea o actualiza registro en BD
   - Retorna: `{ success: boolean, error?: string }`

2. **`obtenerBoletasAlumno(alumnoId)`**
   - Obtiene todas las boletas de un alumno
   - Ordena por fecha descendente
   - Retorna: Lista de boletas con info del subidor

3. **`obtenerTodasLasBoletas()`**
   - Solo para directivos
   - Obtiene todas las boletas del sistema
   - Incluye información del alumno
   - Retorna: Lista completa de boletas

4. **`eliminarBoleta(boletaId)`**
   - Solo para directivos
   - Elimina archivo del storage
   - Elimina registro de BD
   - Retorna: `{ success: boolean, error?: string }`

5. **`obtenerUrlDescargaBoleta(boletaId)`**
   - Genera URL firmada (válida 1 hora)
   - Para descargas seguras
   - Retorna: URL temporal

### Vistas de Usuario

#### Directivo: `/directivo/boletas`

**Características:**
- Formulario de subida de boletas
- Lista de todas las boletas subidas
- Buscador por alumno/periodo/ciclo
- Botones de descargar/eliminar
- Estadísticas de boletas

**Componentes clave:**
- Select de alumnos activos
- Input de periodo y ciclo
- File input (solo PDF)
- Textarea para notas
- Tabla de boletas con acciones

#### Alumno: `/alumno/calificaciones`

**Características:**
- Cards con estadísticas (boletas disponibles, grado, grupo)
- Lista de boletas por periodo
- Información de fecha de publicación
- Botón de descarga grande y visible
- Información sobre el sistema de boletas

**Lo que muestra:**
- Periodo de la boleta
- Ciclo escolar
- Fecha de publicación
- Notas del directivo (si hay)

**Lo que NO muestra:**
- Calificaciones individuales de tareas
- Promedios calculados internamente
- Listado de entregas

#### Padre: `/padre/calificaciones`

**Características:**
- Selector de hijo (dropdown)
- Cards con estadísticas del hijo seleccionado
- Lista de boletas del hijo
- Mismo diseño que vista de alumno
- Información adicional sobre boletas

**Diferencias con vista de alumno:**
- Selector de múltiples hijos
- Estadísticas dinámicas según hijo seleccionado
- Mensaje sobre acceso a boletas de todos los hijos

## Validaciones y Seguridad

### Validaciones de Archivo

```typescript
// Tipo de archivo
if (archivo.type !== 'application/pdf') {
  return { success: false, error: 'El archivo debe ser un PDF' }
}

// Tamaño máximo
if (archivo.size > 10 * 1024 * 1024) { // 10 MB
  return { success: false, error: 'El archivo no debe superar 10MB' }
}
```

### Row Level Security (RLS)

**Políticas en tabla `boletas`:**

```sql
-- Directivos: Acceso completo
CREATE POLICY "Directivos pueden ver todas las boletas"
ON boletas FOR SELECT TO authenticated
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'directivo'));

-- Alumnos: Solo sus boletas
CREATE POLICY "Alumnos pueden ver sus boletas"
ON boletas FOR SELECT TO authenticated
USING (alumno_id IN (SELECT id FROM alumnos WHERE user_id = auth.uid()));

-- Padres: Boletas de sus hijos
CREATE POLICY "Padres pueden ver boletas de sus hijos"
ON boletas FOR SELECT TO authenticated
USING (
  alumno_id IN (
    SELECT a.id FROM alumnos a
    JOIN padres p ON a.padre_id = p.id
    WHERE p.user_id = auth.uid()
  )
);
```

**Políticas en Storage `boletas`:**

```sql
-- Directivos pueden subir
CREATE POLICY "Directivos pueden subir boletas"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'boletas' AND
  auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'directivo')
);

-- Alumnos/Padres pueden ver
CREATE POLICY "Alumnos pueden ver sus boletas"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'boletas' AND
  (auth.uid() IN (SELECT user_id FROM alumnos WHERE id::text = (string_to_array(name, '/'))[2])
   OR auth.uid() IN (SELECT pa.user_id FROM padres pa
                     JOIN alumnos a ON a.padre_id = pa.id
                     WHERE a.id::text = (string_to_array(name, '/'))[2]))
);
```

## Casos de Uso

### Caso 1: Primera Boleta del Ciclo

1. **Contexto:** Fin del primer periodo del ciclo escolar 2024-2025
2. **Acción:** Directivo sube boletas de todos los alumnos
3. **Resultado:**
   - Alumnos pueden descargar su boleta del periodo
   - Padres reciben notificación (futuro)
   - Boleta queda almacenada permanentemente

### Caso 2: Actualización de Boleta

1. **Contexto:** Se detecta un error en una boleta ya subida
2. **Acción:** Directivo sube nueva versión con mismos datos (alumno/periodo/ciclo)
3. **Resultado:**
   - Sistema detecta duplicado
   - Elimina PDF anterior
   - Actualiza con nuevo PDF
   - Mantiene mismo ID de registro

### Caso 3: Padre con Múltiples Hijos

1. **Contexto:** Padre tiene 3 hijos en la escuela
2. **Acción:** Padre accede a `/padre/calificaciones`
3. **Resultado:**
   - Ve selector con sus 3 hijos
   - Puede cambiar entre hijos
   - Descarga boletas de cada uno
   - Todo desde una sola interfaz

### Caso 4: Alumno Nuevo (Sin Boletas)

1. **Contexto:** Alumno recién inscrito en periodo actual
2. **Acción:** Alumno accede a `/alumno/calificaciones`
3. **Resultado:**
   - Ve mensaje "No hay boletas disponibles aún"
   - Información sobre cuándo se publican
   - Interfaz limpia y clara

## Migraciones

### Ejecutar Migración en Supabase

1. Ir a Supabase Dashboard: https://supabase.com/dashboard
2. Seleccionar proyecto
3. Ir a **SQL Editor**
4. Copiar contenido de `CREATE_BOLETAS.sql`
5. Click en **Run**
6. Verificar que se ejecutó correctamente

**Importante:**
```sql
-- PRIMERO: Crear bucket manualmente en Storage
-- Dashboard → Storage → Create bucket
-- Name: "boletas"
-- Public: NO (private)

-- LUEGO: Ejecutar el SQL de políticas y tabla
```

### Verificación Post-Migración

```sql
-- Verificar tabla creada
SELECT COUNT(*) FROM boletas;

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'boletas';

-- Verificar trigger
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_boletas_timestamp';

-- Verificar función auxiliar
SELECT * FROM pg_proc WHERE proname = 'get_boletas_alumno';
```

## Troubleshooting

### Problema: Error al subir PDF

**Causas posibles:**
1. Bucket `boletas` no existe en Storage
2. Usuario no es directivo
3. Archivo no es PDF o supera 10MB
4. Permisos de storage incorrectos

**Solución:**
```sql
-- Verificar rol del usuario
SELECT role FROM profiles WHERE user_id = auth.uid();

-- Verificar bucket existe
SELECT * FROM storage.buckets WHERE id = 'boletas';

-- Verificar políticas de storage
SELECT * FROM storage.policies WHERE bucket_id = 'boletas';
```

### Problema: Alumno no ve boletas

**Causas posibles:**
1. No hay boletas subidas para ese alumno
2. RLS bloqueando acceso
3. Relación alumno-usuario incorrecta

**Solución:**
```sql
-- Verificar boletas del alumno
SELECT * FROM boletas WHERE alumno_id = '{alumno_id}';

-- Verificar relación alumno-usuario
SELECT * FROM alumnos WHERE user_id = auth.uid();

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'boletas' AND cmd = 'SELECT';
```

### Problema: Padre no ve boletas de hijo

**Causas posibles:**
1. Relación padre-hijo incorrecta
2. Campo `padre_id` en `alumnos` es NULL
3. RLS bloqueando acceso

**Solución:**
```sql
-- Verificar relación padre-hijo
SELECT a.* FROM alumnos a
JOIN padres p ON a.padre_id = p.id
WHERE p.user_id = auth.uid();

-- Corregir relación si es necesario
UPDATE alumnos
SET padre_id = '{padre_id}'
WHERE id = '{alumno_id}';
```

### Problema: PDF no se descarga

**Causas posibles:**
1. URL del archivo incorrecta
2. Archivo eliminado del storage
3. Políticas de storage bloqueando acceso

**Solución:**
```sql
-- Verificar URL en BD
SELECT archivo_url FROM boletas WHERE id = '{boleta_id}';

-- Verificar archivo existe en storage
SELECT * FROM storage.objects WHERE bucket_id = 'boletas' AND name LIKE '%{alumno_id}%';

-- Regenerar URL firmada
-- Usar función obtenerUrlDescargaBoleta(boletaId)
```

## Diferencias con Sistema Anterior

| Aspecto | Sistema Anterior | Sistema de Boletas |
|---------|------------------|-------------------|
| Calificaciones | Calculadas internamente | Subidas en PDF externo |
| Promedios | Mostrados por curso/general | No se calculan |
| Fuente de verdad | Base de datos | PDF oficial |
| Actualización | Tiempo real | Por periodo |
| Acceso maestros | Ven todas las calificaciones | No tienen acceso a boletas |
| Edición | Maestros pueden editar | Solo directivo sube/actualiza |
| Formato | Tablas en web | PDF descargable |
| Historial | Entregas individuales | Boleta por periodo |

## Ventajas del Nuevo Sistema

1. **Oficialidad**
   - Las boletas son documentos oficiales procesados externamente
   - Coinciden con boletas impresas/físicas
   - Mayor validez legal

2. **Simplicidad**
   - Alumnos/padres solo descargan PDF
   - No hay confusión con cálculos internos
   - Interfaz más limpia

3. **Control**
   - Solo directivo maneja boletas finales
   - Elimina discrepancias entre sistemas
   - Proceso centralizado

4. **Flexibilidad**
   - Escuela puede usar cualquier sistema externo
   - Formato de boleta personalizado
   - No depende de lógica interna

5. **Auditoría**
   - Registro de quién subió cada boleta
   - Historial de fechas de publicación
   - Trazabilidad completa

## Futuras Mejoras

### Corto Plazo

1. **Notificaciones**
   - Email/SMS cuando se publica nueva boleta
   - Recordatorios para alumnos/padres

2. **Firma Digital**
   - Validación de autenticidad del PDF
   - Código QR en boleta

3. **Comparación de Periodos**
   - Gráficas de evolución entre periodos
   - Análisis de tendencias

### Mediano Plazo

4. **Carga Masiva**
   - Subir múltiples boletas en lote
   - Importar desde Excel/CSV

5. **Templates**
   - Plantillas de boleta personalizables
   - Generación automática de PDF

6. **Historial Académico**
   - Vista consolidada de todas las boletas
   - Exportar historial completo

### Largo Plazo

7. **Integración Externa**
   - API para sistemas de generación de boletas
   - Webhook para actualizaciones automáticas

8. **Análisis Predictivo**
   - IA para detectar patrones en boletas
   - Alertas tempranas de bajo rendimiento

9. **Blockchain**
   - Registro inmutable de boletas
   - Verificación descentralizada

## Notas de Seguridad

✅ **Implementado:**
- Row Level Security en tabla y storage
- Validación de tipos de archivo
- Límites de tamaño de archivo
- Autenticación obligatoria
- Separación de permisos por rol
- URLs firmadas con expiración

⚠️ **Consideraciones:**
- Los PDFs no están encriptados en storage
- URLs públicas (aunque protegidas por RLS)
- Sin verificación de contenido del PDF
- Sin escaneo de malware en archivos

🔒 **Recomendaciones:**
- Implementar escaneo antivirus
- Encriptar PDFs en storage
- Agregar marca de agua con timestamp
- Implementar rate limiting en subidas
- Auditar accesos a boletas regularmente

---

**Versión:** 1.0
**Fecha de Creación:** Noviembre 2025
**Última Actualización:** Noviembre 2025
**Desarrollado por:** Claude Code
