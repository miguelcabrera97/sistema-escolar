/**
 * Script para llenar la base de datos con datos de prueba
 *
 * Este script crea:
 * - Directivos
 * - Maestros
 * - Alumnos
 * - Padres
 * - Cursos
 * - Inscripciones
 * - Tareas
 * - Entregas con calificaciones
 *
 * Uso: npm run seed
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas')
  console.error('   Asegúrate de tener el archivo .env.local configurado correctamente')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Datos de prueba
const DIRECTIVOS = [
  { nombre: 'Ana', apellidos: 'García Rodríguez', email: 'directora@escuela.edu', password: '123456' }
]

const MAESTROS = [
  { nombre: 'Carlos', apellidos: 'Martínez López', email: 'carlos.martinez@escuela.edu', password: '123456', especialidad: 'Matemáticas' },
  { nombre: 'María', apellidos: 'Hernández Silva', email: 'maria.hernandez@escuela.edu', password: '123456', especialidad: 'Español' },
  { nombre: 'Luis', apellidos: 'González Pérez', email: 'luis.gonzalez@escuela.edu', password: '123456', especialidad: 'Ciencias Naturales' },
  { nombre: 'Patricia', apellidos: 'Ramírez Cruz', email: 'patricia.ramirez@escuela.edu', password: '123456', especialidad: 'Historia' },
  { nombre: 'Roberto', apellidos: 'Torres Méndez', email: 'roberto.torres@escuela.edu', password: '123456', especialidad: 'Educación Física' },
  { nombre: 'Laura', apellidos: 'Flores Sánchez', email: 'laura.flores@escuela.edu', password: '123456', especialidad: 'Inglés' }
]

const ALUMNOS = [
  // 3er grado A
  { nombre: 'Juan', apellidos: 'Pérez González', email: 'juan.perez@estudiante.edu', password: '123456', matricula: 'A2025001', grado: '3', grupo: 'A', fecha_nacimiento: '2015-05-15' },
  { nombre: 'María', apellidos: 'López Ramírez', email: 'maria.lopez@estudiante.edu', password: '123456', matricula: 'A2025002', grado: '3', grupo: 'A', fecha_nacimiento: '2015-06-20' },
  { nombre: 'Pedro', apellidos: 'Sánchez Torres', email: 'pedro.sanchez@estudiante.edu', password: '123456', matricula: 'A2025003', grado: '3', grupo: 'A', fecha_nacimiento: '2015-04-10' },
  { nombre: 'Ana', apellidos: 'Martínez Díaz', email: 'ana.martinez@estudiante.edu', password: '123456', matricula: 'A2025004', grado: '3', grupo: 'A', fecha_nacimiento: '2015-07-25' },
  { nombre: 'Carlos', apellidos: 'Rodríguez Flores', email: 'carlos.rodriguez@estudiante.edu', password: '123456', matricula: 'A2025005', grado: '3', grupo: 'A', fecha_nacimiento: '2015-03-30' },

  // 3er grado B
  { nombre: 'Laura', apellidos: 'Gómez Ruiz', email: 'laura.gomez@estudiante.edu', password: '123456', matricula: 'A2025006', grado: '3', grupo: 'B', fecha_nacimiento: '2015-08-12' },
  { nombre: 'Diego', apellidos: 'Hernández Castro', email: 'diego.hernandez@estudiante.edu', password: '123456', matricula: 'A2025007', grado: '3', grupo: 'B', fecha_nacimiento: '2015-09-05' },
  { nombre: 'Sofia', apellidos: 'Morales Ortiz', email: 'sofia.morales@estudiante.edu', password: '123456', matricula: 'A2025008', grado: '3', grupo: 'B', fecha_nacimiento: '2015-02-18' },
  { nombre: 'Miguel', apellidos: 'Vargas Luna', email: 'miguel.vargas@estudiante.edu', password: '123456', matricula: 'A2025009', grado: '3', grupo: 'B', fecha_nacimiento: '2015-11-22' },
  { nombre: 'Valentina', apellidos: 'Mendoza Reyes', email: 'valentina.mendoza@estudiante.edu', password: '123456', matricula: 'A2025010', grado: '3', grupo: 'B', fecha_nacimiento: '2015-01-14' },

  // 4to grado A
  { nombre: 'Fernando', apellidos: 'Cruz Navarro', email: 'fernando.cruz@estudiante.edu', password: '123456', matricula: 'A2025011', grado: '4', grupo: 'A', fecha_nacimiento: '2014-06-08' },
  { nombre: 'Isabella', apellidos: 'Jiménez Vega', email: 'isabella.jimenez@estudiante.edu', password: '123456', matricula: 'A2025012', grado: '4', grupo: 'A', fecha_nacimiento: '2014-07-19' },
  { nombre: 'Andrés', apellidos: 'Gutiérrez Moreno', email: 'andres.gutierrez@estudiante.edu', password: '123456', matricula: 'A2025013', grado: '4', grupo: 'A', fecha_nacimiento: '2014-05-03' },
  { nombre: 'Camila', apellidos: 'Castillo Herrera', email: 'camila.castillo@estudiante.edu', password: '123456', matricula: 'A2025014', grado: '4', grupo: 'A', fecha_nacimiento: '2014-08-27' },
  { nombre: 'Daniel', apellidos: 'Ramos Aguilar', email: 'daniel.ramos@estudiante.edu', password: '123456', matricula: 'A2025015', grado: '4', grupo: 'A', fecha_nacimiento: '2014-04-16' },

  // 5to grado A
  { nombre: 'Gabriela', apellidos: 'Silva Campos', email: 'gabriela.silva@estudiante.edu', password: '123456', matricula: 'A2025016', grado: '5', grupo: 'A', fecha_nacimiento: '2013-09-21' },
  { nombre: 'Ricardo', apellidos: 'Ortega Domínguez', email: 'ricardo.ortega@estudiante.edu', password: '123456', matricula: 'A2025017', grado: '5', grupo: 'A', fecha_nacimiento: '2013-10-11' },
  { nombre: 'Natalia', apellidos: 'Romero Medina', email: 'natalia.romero@estudiante.edu', password: '123456', matricula: 'A2025018', grado: '5', grupo: 'A', fecha_nacimiento: '2013-03-07' },
  { nombre: 'Sebastián', apellidos: 'Nuñez Paredes', email: 'sebastian.nunez@estudiante.edu', password: '123456', matricula: 'A2025019', grado: '5', grupo: 'A', fecha_nacimiento: '2013-12-02' },
  { nombre: 'Daniela', apellidos: 'Cortés Ríos', email: 'daniela.cortes@estudiante.edu', password: '123456', matricula: 'A2025020', grado: '5', grupo: 'A', fecha_nacimiento: '2013-01-28' }
]

const PADRES = [
  { nombre: 'Jorge', apellidos: 'Pérez Martínez', email: 'jorge.perez@padre.com', password: '123456', alumno_matricula: 'A2025001' },
  { nombre: 'Carmen', apellidos: 'López Silva', email: 'carmen.lopez@padre.com', password: '123456', alumno_matricula: 'A2025002' },
  { nombre: 'Roberto', apellidos: 'Sánchez Díaz', email: 'roberto.sanchez@padre.com', password: '123456', alumno_matricula: 'A2025003' },
  { nombre: 'Elena', apellidos: 'Martínez Ruiz', email: 'elena.martinez@padre.com', password: '123456', alumno_matricula: 'A2025004' },
  { nombre: 'Francisco', apellidos: 'Rodríguez Castro', email: 'francisco.rodriguez@padre.com', password: '123456', alumno_matricula: 'A2025005' }
]

const CURSOS = [
  { nombre: 'Matemáticas', descripcion: 'Matemáticas para 3er grado', grado: '3', grupo: 'A' },
  { nombre: 'Español', descripcion: 'Español para 3er grado', grado: '3', grupo: 'A' },
  { nombre: 'Ciencias Naturales', descripcion: 'Ciencias para 3er grado', grado: '3', grupo: 'A' },
  { nombre: 'Matemáticas', descripcion: 'Matemáticas para 3er grado', grado: '3', grupo: 'B' },
  { nombre: 'Español', descripcion: 'Español para 3er grado', grado: '3', grupo: 'B' },
  { nombre: 'Matemáticas', descripcion: 'Matemáticas para 4to grado', grado: '4', grupo: 'A' },
  { nombre: 'Historia', descripcion: 'Historia para 4to grado', grado: '4', grupo: 'A' },
  { nombre: 'Matemáticas', descripcion: 'Matemáticas para 5to grado', grado: '5', grupo: 'A' },
  { nombre: 'Inglés', descripcion: 'Inglés para 5to grado', grado: '5', grupo: 'A' }
]

const TAREAS_TEMPLATES = [
  { titulo: 'Operaciones básicas', descripcion: 'Resolver ejercicios de suma y resta', dias_vencimiento: -5 },
  { titulo: 'Tabla de multiplicar', descripcion: 'Memorizar tablas del 1 al 10', dias_vencimiento: -3 },
  { titulo: 'Problemas matemáticos', descripcion: 'Resolver problemas de la vida real', dias_vencimiento: 2 },
  { titulo: 'Lectura comprensiva', descripcion: 'Leer cuento y responder preguntas', dias_vencimiento: -4 },
  { titulo: 'Redacción creativa', descripcion: 'Escribir una historia corta', dias_vencimiento: 1 },
  { titulo: 'El sistema solar', descripcion: 'Investigar sobre los planetas', dias_vencimiento: -2 },
  { titulo: 'Ciclo del agua', descripcion: 'Hacer un diagrama del ciclo del agua', dias_vencimiento: 3 }
]

async function seed() {
  console.log('🌱 Iniciando seed de la base de datos...\n')

  try {
    // 1. Crear Directivos
    console.log('👔 Creando directivos...')
    const directivosCreados = []
    for (const directivo of DIRECTIVOS) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: directivo.email,
        password: directivo.password,
        email_confirm: true
      })

      if (authError) {
        console.log(`  ⚠️  Directivo ${directivo.email} ya existe, continuando...`)
        continue
      }

      // Crear profile manualmente
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user!.id,
        nombre: directivo.nombre,
        apellidos: directivo.apellidos,
        email: directivo.email,
        role: 'directivo',
        activo: true
      })

      if (profileError) {
        console.log(`  ⚠️  Error al crear profile: ${profileError.message}`)
        continue
      }

      directivosCreados.push(authData.user!.id)
      console.log(`  ✅ Directivo creado: ${directivo.nombre} ${directivo.apellidos}`)
    }

    // 2. Crear Maestros
    console.log('\n👨‍🏫 Creando maestros...')
    const maestrosCreados = []
    for (const maestro of MAESTROS) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: maestro.email,
        password: maestro.password,
        email_confirm: true
      })

      if (authError) {
        console.log(`  ⚠️  Maestro ${maestro.email} ya existe, buscando...`)
        // Intentar buscar el maestro existente por email
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', maestro.email)
          .single()

        if (existingProfile) {
          maestrosCreados.push({ id: existingProfile.id, especialidad: maestro.especialidad })
          console.log(`  ✓ Maestro existente agregado: ${maestro.nombre} ${maestro.apellidos}`)
        }
        continue
      }

      // Crear profile manualmente
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user!.id,
        nombre: maestro.nombre,
        apellidos: maestro.apellidos,
        email: maestro.email,
        role: 'maestro',
        activo: true
      })

      if (profileError) {
        console.log(`  ⚠️  Error al crear profile maestro: ${profileError.message}`)
        continue
      }

      const { data: maestroData, error: maestroError } = await supabase.from('maestros').insert({
        user_id: authData.user!.id,
        especialidad: maestro.especialidad
      }).select().single()

      if (maestroError || !maestroData) {
        console.log(`  ⚠️  Error al crear maestro ${maestro.nombre}: ${maestroError?.message}`)
        continue
      }

      maestrosCreados.push({ id: authData.user!.id, especialidad: maestro.especialidad })
      console.log(`  ✅ Maestro creado: ${maestro.nombre} ${maestro.apellidos} - ${maestro.especialidad}`)
    }

    // 3. Crear Alumnos
    console.log('\n👨‍🎓 Creando alumnos...')
    const alumnosCreados = []
    for (const alumno of ALUMNOS) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: alumno.email,
        password: alumno.password,
        email_confirm: true
      })

      if (authError) {
        console.log(`  ⚠️  Alumno ${alumno.email} ya existe, buscando...`)
        // Intentar buscar el alumno existente por matrícula
        const { data: existingAlumno } = await supabase
          .from('alumnos')
          .select('*')
          .eq('matricula', alumno.matricula)
          .single()

        if (existingAlumno) {
          alumnosCreados.push({
            id: existingAlumno.id,
            user_id: existingAlumno.user_id,
            matricula: existingAlumno.matricula,
            grado: existingAlumno.grado,
            grupo: existingAlumno.grupo,
            nombre: `${alumno.nombre} ${alumno.apellidos}`
          })
          console.log(`  ✓ Alumno existente agregado: ${alumno.nombre} ${alumno.apellidos}`)
        }
        continue
      }

      // Crear profile manualmente
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user!.id,
        nombre: alumno.nombre,
        apellidos: alumno.apellidos,
        email: alumno.email,
        role: 'alumno',
        activo: true
      })

      if (profileError) {
        console.log(`  ⚠️  Error al crear profile alumno: ${profileError.message}`)
        continue
      }

      const { data: alumnoData, error: alumnoError } = await supabase.from('alumnos').insert({
        user_id: authData.user!.id,
        matricula: alumno.matricula,
        grado: alumno.grado,
        grupo: alumno.grupo,
        fecha_nacimiento: alumno.fecha_nacimiento
      }).select().single()

      if (alumnoError || !alumnoData) {
        console.log(`  ⚠️  Error al crear alumno ${alumno.nombre}: ${alumnoError?.message}`)
        continue
      }

      alumnosCreados.push({
        id: alumnoData.id,
        user_id: authData.user!.id,
        matricula: alumno.matricula,
        grado: alumno.grado,
        grupo: alumno.grupo,
        nombre: `${alumno.nombre} ${alumno.apellidos}`
      })
      console.log(`  ✅ Alumno creado: ${alumno.nombre} ${alumno.apellidos} - ${alumno.matricula} - ${alumno.grado}°${alumno.grupo}`)
    }

    // 4. Crear Padres
    console.log('\n👨‍👩‍👧 Creando padres...')
    for (const padre of PADRES) {
      const alumno = alumnosCreados.find(a => a.matricula === padre.alumno_matricula)
      if (!alumno) continue

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: padre.email,
        password: padre.password,
        email_confirm: true
      })

      if (authError) {
        console.log(`  ⚠️  Padre ${padre.email} ya existe, continuando...`)
        continue
      }

      // Crear profile manualmente
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user!.id,
        nombre: padre.nombre,
        apellidos: padre.apellidos,
        email: padre.email,
        role: 'padre',
        activo: true
      })

      if (profileError) {
        console.log(`  ⚠️  Error al crear profile padre: ${profileError.message}`)
        continue
      }

      await supabase.from('padres').insert({
        user_id: authData.user!.id,
        alumno_id: alumno.id
      })

      console.log(`  ✅ Padre creado: ${padre.nombre} ${padre.apellidos} (hijo: ${alumno.nombre})`)
    }

    // 5. Crear Cursos
    console.log('\n📚 Creando cursos...')
    const cursosCreados = []
    for (const curso of CURSOS) {
      // Asignar maestro según la materia
      let maestroId
      if (curso.nombre === 'Matemáticas') {
        maestroId = maestrosCreados.find(m => m.especialidad === 'Matemáticas')?.id
      } else if (curso.nombre === 'Español') {
        maestroId = maestrosCreados.find(m => m.especialidad === 'Español')?.id
      } else if (curso.nombre === 'Ciencias Naturales') {
        maestroId = maestrosCreados.find(m => m.especialidad === 'Ciencias Naturales')?.id
      } else if (curso.nombre === 'Historia') {
        maestroId = maestrosCreados.find(m => m.especialidad === 'Historia')?.id
      } else if (curso.nombre === 'Inglés') {
        maestroId = maestrosCreados.find(m => m.especialidad === 'Inglés')?.id
      }

      if (!maestroId) continue

      const { data: cursoData, error: cursoError } = await supabase.from('cursos').insert({
        nombre: curso.nombre,
        descripcion: curso.descripcion,
        grado: curso.grado,
        grupo: curso.grupo,
        maestro_id: maestroId
      }).select().single()

      if (cursoError || !cursoData) {
        console.log(`  ⚠️  Error al crear curso ${curso.nombre}: ${cursoError?.message}`)
        continue
      }

      cursosCreados.push({
        id: cursoData.id,
        nombre: curso.nombre,
        grado: curso.grado,
        grupo: curso.grupo,
        maestro_id: maestroId
      })
      console.log(`  ✅ Curso creado: ${curso.nombre} - ${curso.grado}°${curso.grupo}`)
    }

    // 6. Inscribir alumnos en cursos
    console.log('\n📝 Inscribiendo alumnos en cursos...')
    let inscripcionesCount = 0
    for (const curso of cursosCreados) {
      const alumnosDelCurso = alumnosCreados.filter(a => a.grado === curso.grado && a.grupo === curso.grupo)

      for (const alumno of alumnosDelCurso) {
        await supabase.from('inscripciones').insert({
          curso_id: curso.id,
          alumno_id: alumno.id
        })
        inscripcionesCount++
      }
      console.log(`  ✅ ${alumnosDelCurso.length} alumnos inscritos en ${curso.nombre} ${curso.grado}°${curso.grupo}`)
    }

    // 7. Crear Tareas
    console.log('\n📋 Creando tareas...')
    const tareasCreadas = []
    for (const curso of cursosCreados) {
      // Crear 3-4 tareas por curso
      const numTareas = Math.floor(Math.random() * 2) + 3 // 3 o 4 tareas

      for (let i = 0; i < numTareas; i++) {
        const template = TAREAS_TEMPLATES[Math.floor(Math.random() * TAREAS_TEMPLATES.length)]
        const fechaVencimiento = new Date()
        fechaVencimiento.setDate(fechaVencimiento.getDate() + template.dias_vencimiento)

        const { data: tareaData, error: tareaError } = await supabase.from('tareas').insert({
          titulo: template.titulo,
          descripcion: template.descripcion,
          fecha_entrega: fechaVencimiento.toISOString(),
          curso_id: curso.id
        }).select().single()

        if (tareaError || !tareaData) {
          console.log(`  ⚠️  Error al crear tarea: ${tareaError?.message}`)
          continue
        }

        tareasCreadas.push({
          id: tareaData.id,
          curso_id: curso.id
        })
      }
      console.log(`  ✅ ${numTareas} tareas creadas para ${curso.nombre} ${curso.grado}°${curso.grupo}`)
    }

    // 8. Crear Entregas y Calificaciones
    console.log('\n✍️  Creando entregas y calificaciones...')
    let entregasCount = 0
    for (const tarea of tareasCreadas) {
      // Obtener alumnos inscritos en el curso de esta tarea
      const { data: inscripciones } = await supabase
        .from('inscripciones')
        .select('alumno_id')
        .eq('curso_id', tarea.curso_id)

      if (!inscripciones) continue

      for (const inscripcion of inscripciones) {
        // 80% de probabilidad de que el alumno haya entregado
        if (Math.random() < 0.8) {
          const fechaEntrega = new Date()
          fechaEntrega.setDate(fechaEntrega.getDate() - Math.floor(Math.random() * 5))

          // Generar calificación aleatoria (70-100)
          const calificacion = Math.floor(Math.random() * 31) + 70

          const retroalimentaciones = [
            'Excelente trabajo, sigue así',
            'Muy buen esfuerzo, felicidades',
            'Buen trabajo, pero puede mejorar',
            'Trabajo satisfactorio',
            'Debes poner más atención a los detalles',
            'Excelente presentación y contenido',
            'Buen razonamiento en los ejercicios'
          ]

          await supabase.from('entregas').insert({
            tarea_id: tarea.id,
            alumno_id: inscripcion.alumno_id,
            status: 'calificada',
            calificacion: calificacion,
            retroalimentacion: retroalimentaciones[Math.floor(Math.random() * retroalimentaciones.length)],
            fecha_entrega: fechaEntrega.toISOString(),
            comentarios: 'Entrega completada en tiempo'
          })
          entregasCount++
        }
      }
    }
    console.log(`  ✅ ${entregasCount} entregas calificadas creadas`)

    console.log('\n✅ ¡Seed completado exitosamente!')
    console.log('\n📊 Resumen:')
    console.log(`  - Directivos: ${directivosCreados.length}`)
    console.log(`  - Maestros: ${maestrosCreados.length}`)
    console.log(`  - Alumnos: ${alumnosCreados.length}`)
    console.log(`  - Padres: ${PADRES.length}`)
    console.log(`  - Cursos: ${cursosCreados.length}`)
    console.log(`  - Inscripciones: ${inscripcionesCount}`)
    console.log(`  - Tareas: ${tareasCreadas.length}`)
    console.log(`  - Entregas calificadas: ${entregasCount}`)

    console.log('\n🔑 Credenciales de prueba:')
    console.log('  Directivo: directora@escuela.edu / 123456')
    console.log('  Maestro: carlos.martinez@escuela.edu / 123456')
    console.log('  Alumno: juan.perez@estudiante.edu / 123456')
    console.log('  Padre: jorge.perez@padre.com / 123456')

  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  }
}

// Ejecutar seed
seed()
  .then(() => {
    console.log('\n✨ Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error)
    process.exit(1)
  })
