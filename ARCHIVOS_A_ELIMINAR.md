# 🗑️ Archivos que Pueden Eliminarse de Forma Segura

## Resumen
Este documento lista los archivos que pueden eliminarse del proyecto porque:
- Son duplicados de versiones más recientes
- Son scripts de debugging temporal
- Son migraciones ya aplicadas
- Son documentación obsoleta

---

## ✅ Script Automático

Ejecuta `LIMPIAR_PROYECTO.bat` para mover automáticamente estos archivos a carpetas de archivo.

O si prefieres eliminarlos manualmente, sigue la lista a continuación:

---

## 📋 Archivos Seguros para Eliminar

### 1. Scripts de Diagnóstico/Debug (Ya usados, no necesarios)
- `DIAGNOSTICO_PADRE_JORGE.sql` - Diagnóstico específico ya resuelto
- `DIAGNOSTICO_RLS_PAGOS.sql` - Debug temporal de RLS
- `DIAGNOSTICO_TABLA_PAGOS.sql` - Debug temporal
- `DEBUG_POLITICAS_PAGOS.sql` - Debug temporal
- `VERIFICAR_CONSTRAINTS_PAGOS.sql` - Verificación temporal
- `VERIFICAR_ESTRUCTURA_PADRE_ALUMNO.sql` - Verificación temporal
- `VERIFICAR_ESTRUCTURA_PAGOS.sql` - Verificación temporal
- `VERIFICAR_RLS_DESHABILITADO.sql` - Verificación temporal
- `VERIFICAR_STORAGE_POLICIES.sql` - Verificación temporal
- `VERIFICAR-MAESTROS.sql` - Verificación temporal
- `CONSULTAS_PADRE_ALUMNO.sql` - Consultas de prueba

### 2. Scripts SQL Experimentales/Temporales (No usar)
- `DESHABILITAR_RLS_STORAGE.sql` - **PELIGROSO** - Deshabilita seguridad
- `DESHABILITAR_RLS_TAREAS.sql` - **PELIGROSO** - Deshabilita seguridad
- `DESHABILITAR_RLS_TODAS_TABLAS.sql` - **PELIGROSO** - Deshabilita seguridad
- `DESHABILITAR_RLS_TODO.sql` - **PELIGROSO** - Deshabilita seguridad
- `SOLUCION_TEMPORAL_RLS.sql` - Solución temporal (reemplazada)
- `BYPASS_RLS_SERVICE_ROLE.md` - Bypass temporal (no usar)
- `TEST_INSERT_PAGO_MANUAL.sql` - Test manual (no necesario)

### 3. Migraciones Ya Aplicadas (No volver a ejecutar)
- `ADD_ACTIVO_FIELD.sql` - Campo activo ya agregado
- `ADD_CAMPOS_ALUMNO.sql` - Campos ya agregados
- `AGREGAR_COLUMNA_NOTAS_BOLETAS.md` - Columna ya agregada
- `AGREGAR_CURP_ALUMNOS.md` - CURP ya agregado
- `CORREGIR-FK-CURSOS.sql` - FK ya corregida
- `REMOVE_PUNTOS_MAXIMOS_FROM_TAREAS.sql` - Columna ya removida
- `fix_inscripciones.sql` - Fix ya aplicado
- `supabase-trigger.sql` - Trigger ya creado

### 4. Scripts de Creación Inicial (Ya ejecutados)
- `CREATE_BOLETAS.sql` - Tabla ya creada
- `CREATE_BOLETAS_SIMPLE.sql` - Versión antigua (duplicado)
- `CREATE_CURSO_AUXILIARES.sql` - Tabla ya creada

### 5. Fixes Duplicados (Versiones antiguas)

**Boletas - MANTENER SOLO:**
- ✅ `APLICAR_FIX_BOLETAS_PADRES.sql` (MÁS RECIENTE)
- ✅ `GUIA_RAPIDA_BOLETAS_PADRES.md` (MÁS RECIENTE)

**Eliminar:**
- ❌ `FIX_BOLETAS_PADRES.sql` (versión antigua)
- ❌ `SOLUCIONAR_BOLETAS_PADRES.md` (versión antigua)

**Padre-Alumno - MANTENER SOLO:**
- ✅ `APLICAR_FIX_PADRE_ALUMNO.sql` (MÁS RECIENTE)

**Eliminar:**
- ❌ `FIX_PADRE_NO_VE_ALUMNOS.md` (versión antigua)
- ❌ `FIX_RLS_PADRE_ALUMNO_COMPLETO.sql` (versión antigua)
- ❌ `INSTRUCCIONES_FIX_PADRE_ALUMNO.md` (versión antigua)

**Pagos - MANTENER SOLO:**
- ✅ `APLICAR_FIX_PAGOS_RLS.sql` (MÁS RECIENTE)

**Eliminar:**
- ❌ `FIX_COMPLETO_RLS.sql` (versión antigua)
- ❌ `FIX_ESTRUCTURA_PAGOS.sql` (versión antigua)
- ❌ `FIX_RLS_PAGOS_COMPLETO.sql` (versión antigua)

### 6. Documentación Obsoleta
- `APLICAR_MIGRACIONES.sql` - Ya no se usa
- `INSTRUCCIONES_MIGRACION.md` - Obsoleto
- `EJEMPLO-USO-MIDDLEWARE.md` - No implementado
- `DATOS-PRUEBA.md` - Ya no necesario
- `ASIGNACION-AUTOMATICA-CURSOS.md` - No implementado
- `SOLUCION-CAMPO-ACTIVO.md` - Ya resuelto

---

## ✅ Archivos IMPORTANTES que NO debes Eliminar

### Documentación Esencial
- ✅ `README.md` - Documentación principal del proyecto
- ✅ `ESTADO_ACTUAL_SISTEMA.md` - Estado actual del sistema
- ✅ `PROGRESO-PROYECTO.md` - Historial de progreso
- ✅ `AUTHENTICATION.md` - Sistema de autenticación
- ✅ `GESTION-USUARIOS.md` - Gestión de usuarios

### Guías de Configuración Actuales
- ✅ `GUIA_RAPIDA_BOLETAS_PADRES.md` - Guía para resolver problema boletas
- ✅ `CONFIGURAR_LOGO_ESCUELA.md` - Configuración del logo
- ✅ `CONFIGURAR_RLS_ENTREGAS.md` - Configuración RLS entregas
- ✅ `CONFIGURAR_STORAGE_BOLETAS.md` - Configuración storage boletas
- ✅ `CONFIGURAR_STORAGE_TAREAS.md` - Configuración storage tareas
- ✅ `SETUP_HTTPS_LOCAL.md` - Setup HTTPS para desarrollo local

### Scripts SQL Activos/Útiles
- ✅ `APLICAR_FIX_BOLETAS_PADRES.sql` - Fix actual para boletas padres
- ✅ `APLICAR_FIX_PADRE_ALUMNO.sql` - Fix actual relaciones padre-alumno
- ✅ `APLICAR_FIX_PAGOS_RLS.sql` - Fix actual pagos RLS

### Documentación de Sistemas
- ✅ `SISTEMA-BOLETAS-PDF.md` - Sistema de boletas
- ✅ `SISTEMA-CALIFICACIONES.md` - Sistema de calificaciones
- ✅ `SISTEMA-GESTION-CURSOS.md` - Sistema de cursos
- ✅ `SISTEMA-RECIBOS-PDF.md` - Sistema de recibos
- ✅ `ROL-AUXILIAR-CALIFICACIONES.md` - Rol de auxiliar

### Documentación de Integraciones
- ✅ `MERCADOPAGO_CHECKOUT_API.md` - Integración Mercado Pago
- ✅ `MERCADOPAGO_SETUP.md` - Setup Mercado Pago
- ✅ `CREAR_GRADOS_GRUPOS.md` - Creación de grados y grupos

---

## 🚀 Cómo Limpiar el Proyecto

### Opción 1: Automática (Recomendada)
```bash
# Ejecuta el script batch
LIMPIAR_PROYECTO.bat
```

Esto moverá los archivos obsoletos a:
- `docs/sql-obsoletos/` - Scripts SQL obsoletos
- `docs/archive/` - Documentación archivada

### Opción 2: Manual
Puedes eliminar manualmente los archivos listados arriba, o moverlos a una carpeta `archive/` si prefieres conservarlos por si acaso.

### Opción 3: Eliminar Todo lo Obsoleto
Si estás seguro de que no necesitas ningún archivo obsoleto:

```bash
# Windows PowerShell
cd c:\Users\Miguel\Desktop\sistema-escolar
Remove-Item docs\sql-obsoletos\* -Recurse -Force
Remove-Item docs\archive\* -Recurse -Force
```

---

## 📊 Resultado Esperado

**Antes de limpiar:**
- 65+ archivos .md, .sql, .txt en la raíz

**Después de limpiar:**
- ~20 archivos importantes en la raíz
- ~30 archivos obsoletos en `docs/sql-obsoletos/`
- ~15 archivos archivados en `docs/archive/`

---

## ⚠️ Precaución

Antes de eliminar completamente cualquier archivo:
1. Asegúrate de tener un backup de tu proyecto
2. Ejecuta primero `LIMPIAR_PROYECTO.bat` para mover (no eliminar)
3. Verifica que todo funciona correctamente
4. Después de 1-2 semanas, puedes eliminar las carpetas de archivo

---

**Última actualización**: Enero 2025
