# 🏫 Sistema Escolar

Sistema de gestión escolar integral para instituciones educativas, que permite administrar alumnos, maestros, padres de familia, pagos, calificaciones, boletas y cursos. Desarrollado con **Next.js 15**, **React 19**, **Supabase** y **Tailwind CSS**.

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Roles de Usuario](#roles-de-usuario)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Variables de Entorno](#variables-de-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Base de Datos](#base-de-datos)
- [Scripts Disponibles](#scripts-disponibles)
- [Despliegue](#despliegue)

---

## ✨ Características

### Para el Directivo (Administrador)
- **Panel de control** con resúmenes y estadísticas de la institución
- **Gestión de usuarios**: Crear, editar, activar/desactivar y eliminar permanentemente alumnos, maestros, auxiliares y padres
- **Perfiles de usuario** con vistas de detalle individuales con datos y relaciones
- **Gestión de cursos**: Crear cursos, asignar maestros e inscribir alumnos
- **Grados y grupos**: Configuración del nivel escolar de la institución
- **Relaciones Padre-Alumno**: Vincular padres con sus hijos estudiantes
- **Alumnos por grado**: Vista filtrada de estudiantes por nivel y grupo
- **Gestión de pagos**: Crear y administrar cobros, pagos manuales y revisión de comprobantes
- **Boletas de calificaciones**: Generación y consulta de boletas por período

### Para el Maestro
- **Vista de cursos a cargo** con lista de alumnos inscritos y tareas
- **Gestión de calificaciones** por materia y período
- **Tareas y actividades** asignadas a sus grupos

### Para el Alumno
- **Panel personal** con acceso a sus materias, calificaciones y boleta
- **Cambio de contraseña** desde su cuenta

### Para el Padre
- **Panel de seguimiento** del rendimiento académico de sus hijos
- **Historial y estado de pagos** de la cuenta escolar
- **Subida de comprobantes de pago** con flujo de aprobación

### Para el Auxiliar
- **Vista de calificaciones y asistencia** asignada a su función

---

## 👥 Roles de Usuario

| Rol         | Acceso a                                           |
|-------------|----------------------------------------------------|
| `directivo` | Administración completa del sistema                |
| `maestro`   | Cursos a cargo, calificaciones, tareas             |
| `alumno`    | Sus materias, calificaciones, tareas y boleta      |
| `padre`     | Seguimiento de hijos, pagos y cobros               |
| `auxiliar`  | Calificaciones y asistencia de su área             |

El control de acceso se gestiona mediante **middleware de autenticación** (`middleware.ts`) que valida el rol del usuario y redirige al dashboard correspondiente. También se usa Row Level Security (RLS) de Supabase para proteger los datos a nivel de base de datos.

---

## 🛠️ Tecnologías

| Categoría         | Tecnología                                              |
|-------------------|---------------------------------------------------------|
| Framework         | [Next.js 15](https://nextjs.org/) (App Router + Turbopack) |
| Frontend          | [React 19](https://react.dev/)                         |
| Estilos           | [Tailwind CSS v4](https://tailwindcss.com/)             |
| Componentes UI    | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| Iconos            | [Lucide React](https://lucide.dev/)                     |
| Backend/BaaS      | [Supabase](https://supabase.com/) (Auth, DB, Storage)  |
| ORM/Queries       | Supabase JS Client                                      |
| Formularios       | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Pagos             | [Mercado Pago](https://www.mercadopago.com.mx/)         |
| Email             | [Resend](https://resend.com/)                           |
| PDF               | [jsPDF](https://github.com/parallax/jsPDF)              |
| Lenguaje          | TypeScript                                              |

---

## 📦 Requisitos Previos

- Node.js 18 o superior
- NPM 9 o superior
- Cuenta en [Supabase](https://supabase.com/) (base de datos y autenticación)
- Cuenta en [Mercado Pago Developers](https://www.mercadopago.com.mx/developers) (para pagos)
- Cuenta en [Resend](https://resend.com/) (para envío de correos)

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/sistema-escolar.git
cd sistema-escolar
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales (ver sección [Variables de Entorno](#variables-de-entorno)).

### 4. Configurar la base de datos

Ejecuta las migraciones de SQL ubicadas en la carpeta `/supabase` dentro de tu proyecto de Supabase, en el orden numérico que aparecen.

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🔑 Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key   # Solo para operaciones del servidor

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=tu-access-token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu-public-key
MERCADOPAGO_WEBHOOK_SECRET=tu-webhook-secret

# Resend (Email)
RESEND_API_KEY=re_tu-api-key

# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Nunca** incluyas el archivo `.env.local` en tu repositorio. Ya se encuentra en `.gitignore`.

---

## 🗂️ Estructura del Proyecto

```
sistema-escolar/
├── app/
│   ├── actions/              # Server Actions (lógica de backend)
│   │   ├── usuarios-actions.ts
│   │   ├── cursos-actions.ts
│   │   ├── pagos-actions.ts
│   │   ├── calificaciones-actions.ts
│   │   └── ...
│   ├── directivo/            # Páginas y componentes del administrador
│   │   ├── page.tsx          # Panel de control
│   │   ├── usuarios/         # Gestión de usuarios + perfiles
│   │   ├── cursos/           # Gestión de cursos
│   │   ├── pagos/            # Gestión de pagos y cobros
│   │   ├── boletas/          # Boletas de calificaciones
│   │   ├── grados-grupos/    # Configuración académica
│   │   └── relaciones-padre-alumno/
│   ├── maestro/              # Páginas del maestro
│   ├── alumno/               # Páginas del alumno
│   ├── padre/                # Páginas del padre
│   ├── auxiliar/             # Páginas del auxiliar
│   ├── login/                # Página de inicio de sesión
│   ├── auth/                 # Callbacks de autenticación
│   └── recuperar-password/   # Flujo de recuperación de contraseña
├── components/
│   └── ui/                   # Componentes de shadcn/ui
├── lib/
│   ├── supabase/             # Clientes de Supabase (cliente y servidor)
│   ├── auth-server.ts        # Utilidades de autenticación en servidor
│   └── constants.ts          # Constantes globales (roles, rutas)
├── supabase/                 # Migraciones SQL y configuración
├── scripts/                  # Scripts de seed y limpieza de DB
├── middleware.ts             # Control de acceso y redirección por rol
└── public/                   # Archivos estáticos
```

---

## 🗄️ Base de Datos

El sistema utiliza **PostgreSQL** a través de Supabase. Las tablas principales son:

| Tabla                   | Descripción                                              |
|-------------------------|----------------------------------------------------------|
| `profiles`              | Datos del perfil de todos los usuarios del sistema       |
| `alumnos`               | Datos académicos de los estudiantes (matrícula, grado)   |
| `maestros`              | Referencia de usuarios con rol maestro                   |
| `padres`                | Referencia de usuarios con rol padre o tutor             |
| `auxiliares_calificaciones` | Referencia de usuarios auxiliares                   |
| `padre_alumno`          | Relación muchos-a-muchos entre padres y alumnos          |
| `cursos`                | Cursos o materias del ciclo escolar                      |
| `curso_alumnos`         | Alumnos inscritos en cada curso                          |
| `calificaciones`        | Calificaciones por alumno, curso y período               |
| `cobros`                | Cobros generados por el directivo                        |
| `pagos`                 | Registro de pagos y su estado de aprobación              |

La autenticación está gestionada por **Supabase Auth**, que crea una entrada en `auth.users` por cada usuario registrado. A cada usuario de auth le corresponde un perfil en la tabla `profiles`.

> La seguridad de datos se aplica mediante **Row Level Security (RLS)** de Supabase, y las operaciones administrativas privilegiadas usan el `SUPABASE_SERVICE_ROLE_KEY` solo desde el servidor.

---

## 📜 Scripts Disponibles

```bash
# Servidor de desarrollo (Turbopack)
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor de producción
npm start

# Linter
npm run lint

# Poblar la base de datos con datos de prueba
npm run seed

# Limpiar la base de datos (remueve datos de prueba)
npm run clean
```

---

## ☁️ Despliegue

Este proyecto está preparado para desplegarse en **Vercel**.

### Pasos:

1. Haz push de tu repositorio a GitHub/GitLab/Bitbucket.
2. Importa el proyecto desde el [Dashboard de Vercel](https://vercel.com/dashboard).
3. Configura las mismas variables de entorno en la sección **Environment Variables** del proyecto en Vercel.
4. Vercel detectará automáticamente que es un proyecto Next.js y lo desplegará.

> 💡 Asegúrate de configurar la variable `NEXT_PUBLIC_APP_URL` con tu dominio de producción y de actualizar la URL del webhook de Mercado Pago con ese dominio.

---

## 🔐 Seguridad

- Toda autenticación es manejada por **Supabase Auth**
- Las rutas protegidas están validadas en `middleware.ts` por rol y sesión
- Las server actions verifican el rol del usuario con `requireServerRole()` antes de ejecutar cualquier operación sensible
- Las operaciones que requieren acceso total a la base de datos (ej. eliminar cuenta de auth) usan el `supabaseAdmin` con el `SERVICE_ROLE_KEY` exclusivamente desde el servidor
- Se aplica **RLS** en Supabase para garantizar que cada usuario solo acceda a sus propios datos

---

## 📄 Licencia

Este proyecto es privado y de uso exclusivo de la institución educativa.
