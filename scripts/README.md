# Scripts de Base de Datos

Este directorio contiene scripts para gestionar los datos de prueba del sistema escolar.

## Scripts Disponibles

### 1. `seed-database.ts` - Llenar Base de Datos

Llena la base de datos con datos de prueba realistas.

**Uso:**
```bash
npm run seed
```

**Datos creados:**
- **1 Directivo**
  - directora@escuela.edu / 123456

- **6 Maestros**
  - carlos.martinez@escuela.edu / 123456 (Matemáticas)
  - maria.hernandez@escuela.edu / 123456 (Español)
  - luis.gonzalez@escuela.edu / 123456 (Ciencias Naturales)
  - patricia.ramirez@escuela.edu / 123456 (Historia)
  - roberto.torres@escuela.edu / 123456 (Educación Física)
  - laura.flores@escuela.edu / 123456 (Inglés)

- **20 Alumnos**
  - 5 alumnos de 3° A (matrículas A2025001-A2025005)
  - 5 alumnos de 3° B (matrículas A2025006-A2025010)
  - 5 alumnos de 4° A (matrículas A2025011-A2025015)
  - 5 alumnos de 5° A (matrículas A2025016-A2025020)
  - Primer alumno: juan.perez@estudiante.edu / 123456

- **5 Padres**
  - jorge.perez@padre.com / 123456 (padre de Juan Pérez)
  - carmen.lopez@padre.com / 123456 (padre de María López)
  - Y 3 padres más...

- **9 Cursos**
  - Matemáticas 3°A, Español 3°A, Ciencias 3°A
  - Matemáticas 3°B, Español 3°B
  - Matemáticas 4°A, Historia 4°A
  - Matemáticas 5°A, Inglés 5°A

- **Inscripciones**: Alumnos inscritos automáticamente en los cursos de su grado/grupo

- **Tareas**: 3-4 tareas por curso con fechas variadas

- **Entregas calificadas**: ~80% de los alumnos con entregas calificadas (70-100 puntos)

---

### 2. `clean-database.ts` - Limpiar Base de Datos

Elimina **TODOS** los datos de la base de datos.

**Uso:**
```bash
npm run clean
```

**⚠️ ADVERTENCIA:** Este comando es destructivo y eliminará:
- Todas las entregas
- Todas las tareas
- Todas las inscripciones
- Todos los cursos
- Todos los padres
- Todos los alumnos
- Todos los maestros
- Todos los perfiles
- Todos los usuarios de autenticación (si tienes permisos)

El script pedirá confirmación antes de ejecutarse. Debes escribir **"SI"** para confirmar.

---

## Flujo de Trabajo Recomendado

### Resetear y llenar la base de datos desde cero:

```bash
# 1. Limpiar todo
npm run clean

# 2. Llenar con datos frescos
npm run seed
```

### Verificar los datos creados:

1. Inicia la aplicación: `npm run dev`
2. Accede a http://localhost:3000/login
3. Prueba con alguna de las credenciales:
   - **Directivo**: directora@escuela.edu / 123456
   - **Maestro**: carlos.martinez@escuela.edu / 123456
   - **Alumno**: juan.perez@estudiante.edu / 123456
   - **Padre**: jorge.perez@padre.com / 123456

---

## Troubleshooting

### Error: "supabaseUrl is required"
- Verifica que tienes el archivo `.env.local` en la raíz del proyecto
- Asegúrate de que contiene `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`

### Error: "User already exists"
- Ejecuta `npm run clean` primero para eliminar usuarios existentes
- O elimina manualmente los usuarios desde Supabase Dashboard > Authentication > Users

### Error: "Foreign key constraint violation"
- Asegúrate de ejecutar `npm run clean` antes de `npm run seed`
- Verifica que las tablas estén vacías antes de ejecutar el seed

### Los usuarios ya existen pero no se crean datos
- Ejecuta este SQL en Supabase SQL Editor:
  ```sql
  DELETE FROM entregas;
  DELETE FROM tareas;
  DELETE FROM inscripciones;
  DELETE FROM cursos;
  DELETE FROM padres;
  DELETE FROM alumnos;
  DELETE FROM maestros;
  DELETE FROM profiles;
  ```
- Luego ejecuta `npm run seed` de nuevo

---

## Personalización

Para modificar los datos de prueba, edita el archivo `seed-database.ts`:

- **Línea 41-43**: Cambiar datos de directivos
- **Línea 45-52**: Cambiar datos de maestros
- **Línea 54-75**: Cambiar datos de alumnos
- **Línea 77-83**: Cambiar datos de padres
- **Línea 85-94**: Cambiar cursos
- **Línea 96-103**: Cambiar templates de tareas

---

## Notas Importantes

1. **Contraseña por defecto**: Todos los usuarios tienen la contraseña `123456`
2. **Emails únicos**: Todos los emails deben ser únicos en Supabase Auth
3. **Matrículas únicas**: Las matrículas de alumnos deben ser únicas
4. **Service Role Key**: Se requiere la clave de servicio de Supabase para crear usuarios

---

**Última actualización:** 19 de Octubre, 2025
