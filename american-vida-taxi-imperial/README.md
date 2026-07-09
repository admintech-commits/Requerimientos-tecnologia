# Portal Corporativo — American Vida · Taxi Imperial S.A.S.

Plataforma de **gestión de requerimientos tecnológicos**: registro, clasificación, priorización, flujo de aprobación con trazabilidad completa y dashboard de indicadores.

- **Frontend**: React 18 + TypeScript + Vite (responsive, mobile-first)
- **Backend**: Node.js + Express + TypeScript, base de datos **SQLite** local (en `server/`)

## Requisitos

- Node.js 18 o superior (recomendado 22)

## Puesta en marcha

Se necesitan **dos terminales**:

```bash
# Terminal 1 — API (crea la base de datos y datos de prueba al primer arranque)
cd server
npm install
npm run dev        # http://localhost:3000

# Terminal 2 — Frontend
npm install
npm run dev        # http://localhost:5173
```

## Usuarios de prueba

| Rol | Correo | Contraseña | Puede |
|---|---|---|---|
| Empleado | `empleado@empresa.com` | `demo1234` | Registrar y consultar requerimientos |
| Aprobador | `aprobador@empresa.com` | `demo1234` | Además: validar, aprobar y mover estados |

## Funcionalidades

- **Registro de requerimientos** con campos estructurados: título, descripción detallada, área solicitante, tipo de solicitud, impacto, urgencia, fecha requerida y adjuntos (nombres/enlaces).
- **Priorización automática**: impacto × urgencia (1–9) → alta / media / baja. La lista se ordena por prioridad.
- **Flujo de estados** validado en el backend: creado → en revisión → aprobado → en desarrollo → en pruebas → finalizado (con rechazo posible en revisión y retorno de pruebas a desarrollo).
- **Aprobación por rol**: solo los aprobadores cambian estados, con comentario opcional.
- **Trazabilidad completa**: cada transición queda registrada (quién, cuándo, comentario) y se muestra como línea de tiempo.
- **Seguimiento**: lista con filtros por estado, área, prioridad y búsqueda de texto.
- **Dashboard**: KPIs (totales, abiertos, alta prioridad, finalizados últimos 30 días) y distribución por estado, área y prioridad con enlaces a la lista filtrada.

## Arquitectura

```
├── src/                        # Frontend (features + componentes UI compartidos)
│   ├── components/{ui,layout}/
│   ├── config/brands.ts        # Marcas y logos centralizados
│   ├── lib/apiClient.ts        # Cliente HTTP con token JWT
│   └── features/
│       ├── auth/               # Login, AuthContext (sesión + roles)
│       └── requirements/       # Dashboard, lista, registro, detalle
└── server/                     # API REST
    └── src/
        ├── domain/types.ts     # Tipos, estados, transiciones, priorización
        ├── db/                 # Conexión SQLite + seed de datos de prueba
        ├── middleware/         # Auth JWT, roles, manejo de errores
        └── modules/
            ├── auth/           # POST /api/auth/login
            └── requirements/   # routes → service → repository
```

La capa **repository** encapsula todo el SQL: la lógica de negocio (service) no conoce la base de datos.

## Ruta a AWS

El backend está diseñado para desplegarse sin cambios de código:

1. **Contenedor**: `server/Dockerfile` ya está listo (`docker build -t requerimientos-api server/`). Desplegable en EC2, ECS o App Runner.
2. **Base de datos**: SQLite corre en un volumen (`/app/data`). Para producción con múltiples instancias, migrar a **RDS (PostgreSQL)** reemplazando solo `server/src/db/` y los repositorios — el SQL es estándar y portable.
3. **Configuración**: todo por variables de entorno (`PORT`, `DB_PATH`, `JWT_SECRET`, `CORS_ORIGIN`). En AWS usar Secrets Manager para `JWT_SECRET`.
4. **Frontend**: `npm run build` genera `/dist` estático, servible desde S3 + CloudFront (definir `VITE_API_URL` al construir).

## Próximos pasos sugeridos

1. Subida real de archivos adjuntos (S3 presignado).
2. Notificaciones por correo al cambiar de estado.
3. Pruebas: Vitest en frontend (hooks/validadores) y Supertest en el API.
4. Campo "recursos disponibles" para refinar la priorización.
