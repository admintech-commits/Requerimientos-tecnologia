export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbPath: process.env.DB_PATH ?? './data/requerimientos.db',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-cambiar',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  tokenExpiry: '8h',
} as const;
