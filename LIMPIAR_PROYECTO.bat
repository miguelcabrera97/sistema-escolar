@echo off
echo ====================================
echo LIMPIEZA DE ARCHIVOS DEL PROYECTO
echo ====================================
echo.

REM Crear carpetas de organización
mkdir docs\archive 2>nul
mkdir docs\sql-obsoletos 2>nul

echo Moviendo archivos obsoletos...

REM === ARCHIVOS OBSOLETOS DE DEBUG Y DIAGNOSTICO ===
move DIAGNOSTICO_PADRE_JORGE.sql docs\sql-obsoletos\ 2>nul
move DIAGNOSTICO_RLS_PAGOS.sql docs\sql-obsoletos\ 2>nul
move DIAGNOSTICO_TABLA_PAGOS.sql docs\sql-obsoletos\ 2>nul
move DEBUG_POLITICAS_PAGOS.sql docs\sql-obsoletos\ 2>nul
move VERIFICAR_CONSTRAINTS_PAGOS.sql docs\sql-obsoletos\ 2>nul
move VERIFICAR_ESTRUCTURA_PADRE_ALUMNO.sql docs\sql-obsoletos\ 2>nul
move VERIFICAR_ESTRUCTURA_PAGOS.sql docs\sql-obsoletos\ 2>nul
move VERIFICAR_RLS_DESHABILITADO.sql docs\sql-obsoletos\ 2>nul
move VERIFICAR_STORAGE_POLICIES.sql docs\sql-obsoletos\ 2>nul
move VERIFICAR-MAESTROS.sql docs\sql-obsoletos\ 2>nul
move CONSULTAS_PADRE_ALUMNO.sql docs\sql-obsoletos\ 2>nul

REM === SCRIPTS SQL TEMPORALES/EXPERIMENTALES ===
move DESHABILITAR_RLS_STORAGE.sql docs\sql-obsoletos\ 2>nul
move DESHABILITAR_RLS_TAREAS.sql docs\sql-obsoletos\ 2>nul
move DESHABILITAR_RLS_TODAS_TABLAS.sql docs\sql-obsoletos\ 2>nul
move DESHABILITAR_RLS_TODO.sql docs\sql-obsoletos\ 2>nul
move SOLUCION_TEMPORAL_RLS.sql docs\sql-obsoletos\ 2>nul
move BYPASS_RLS_SERVICE_ROLE.md docs\sql-obsoletos\ 2>nul
move TEST_INSERT_PAGO_MANUAL.sql docs\sql-obsoletos\ 2>nul

REM === MIGRACIONES Y FIXES APLICADOS ===
move ADD_ACTIVO_FIELD.sql docs\sql-obsoletos\ 2>nul
move ADD_CAMPOS_ALUMNO.sql docs\sql-obsoletos\ 2>nul
move AGREGAR_COLUMNA_NOTAS_BOLETAS.md docs\sql-obsoletos\ 2>nul
move AGREGAR_CURP_ALUMNOS.md docs\sql-obsoletos\ 2>nul
move CORREGIR-FK-CURSOS.sql docs\sql-obsoletos\ 2>nul
move REMOVE_PUNTOS_MAXIMOS_FROM_TAREAS.sql docs\sql-obsoletos\ 2>nul
move fix_inscripciones.sql docs\sql-obsoletos\ 2>nul
move supabase-trigger.sql docs\sql-obsoletos\ 2>nul

REM === FIXES DUPLICADOS (mantenemos solo los más recientes) ===
REM Mantenemos: APLICAR_FIX_BOLETAS_PADRES.sql y GUIA_RAPIDA_BOLETAS_PADRES.md
move FIX_BOLETAS_PADRES.sql docs\sql-obsoletos\ 2>nul
move SOLUCIONAR_BOLETAS_PADRES.md docs\sql-obsoletos\ 2>nul

REM Mantenemos: APLICAR_FIX_PADRE_ALUMNO.sql
move FIX_PADRE_NO_VE_ALUMNOS.md docs\sql-obsoletos\ 2>nul
move FIX_RLS_PADRE_ALUMNO_COMPLETO.sql docs\sql-obsoletos\ 2>nul
move INSTRUCCIONES_FIX_PADRE_ALUMNO.md docs\sql-obsoletos\ 2>nul

REM Mantenemos: APLICAR_FIX_PAGOS_RLS.sql
move FIX_COMPLETO_RLS.sql docs\sql-obsoletos\ 2>nul
move FIX_ESTRUCTURA_PAGOS.sql docs\sql-obsoletos\ 2>nul
move FIX_RLS_PAGOS_COMPLETO.sql docs\sql-obsoletos\ 2>nul

REM === SCRIPTS DE CREACION INICIAL (YA APLICADOS) ===
move CREATE_BOLETAS.sql docs\sql-obsoletos\ 2>nul
move CREATE_BOLETAS_SIMPLE.sql docs\sql-obsoletos\ 2>nul
move CREATE_CURSO_AUXILIARES.sql docs\sql-obsoletos\ 2>nul

REM === DOCUMENTACION OBSOLETA ===
move APLICAR_MIGRACIONES.sql docs\archive\ 2>nul
move INSTRUCCIONES_MIGRACION.md docs\archive\ 2>nul
move EJEMPLO-USO-MIDDLEWARE.md docs\archive\ 2>nul
move DATOS-PRUEBA.md docs\archive\ 2>nul
move ASIGNACION-AUTOMATICA-CURSOS.md docs\archive\ 2>nul
move SOLUCION-CAMPO-ACTIVO.md docs\archive\ 2>nul

echo.
echo ====================================
echo ARCHIVOS IMPORTANTES MANTENIDOS:
echo ====================================
echo.
echo README.md - Documentacion principal
echo GUIA_RAPIDA_BOLETAS_PADRES.md - Guia actualizada boletas
echo APLICAR_FIX_BOLETAS_PADRES.sql - Fix para boletas padres
echo APLICAR_FIX_PADRE_ALUMNO.sql - Fix relaciones
echo APLICAR_FIX_PAGOS_RLS.sql - Fix pagos
echo CONFIGURAR_LOGO_ESCUELA.md - Configuracion logo
echo CONFIGURAR_RLS_ENTREGAS.md - Configuracion entregas
echo CONFIGURAR_STORAGE_BOLETAS.md - Configuracion storage
echo CONFIGURAR_STORAGE_TAREAS.md - Configuracion tareas
echo AUTHENTICATION.md - Autenticacion
echo CREAR_GRADOS_GRUPOS.md - Grados y grupos
echo ESTADO_ACTUAL_SISTEMA.md - Estado del sistema
echo GESTION-USUARIOS.md - Gestion de usuarios
echo MERCADOPAGO_CHECKOUT_API.md - Mercado Pago API
echo MERCADOPAGO_SETUP.md - Setup Mercado Pago
echo PROGRESO-PROYECTO.md - Progreso
echo ROL-AUXILIAR-CALIFICACIONES.md - Rol auxiliar
echo SETUP_HTTPS_LOCAL.md - HTTPS local
echo SISTEMA-BOLETAS-PDF.md - Sistema boletas
echo SISTEMA-CALIFICACIONES.md - Sistema calificaciones
echo SISTEMA-GESTION-CURSOS.md - Gestion cursos
echo SISTEMA-RECIBOS-PDF.md - Recibos PDF
echo.
echo ====================================
echo LIMPIEZA COMPLETADA
echo ====================================
echo Archivos obsoletos movidos a: docs\sql-obsoletos\
echo Archivos archivados movidos a: docs\archive\
echo.
pause
