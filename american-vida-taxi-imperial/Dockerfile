# ─────────────────────────────────────────────
# Stage 1: Build del frontend (React 18 + Vite)
# ─────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /build

COPY package*.json ./
RUN npm ci --prefer-offline

COPY index.html vite.config.ts tsconfig.json ./
COPY public ./public
COPY src ./src

# Variables de build del frontend (se sobreescriben con --build-arg en docker-compose)
ARG VITE_BASE_URL=/requerimientos/
ARG VITE_API_URL=/requerimientos/api
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build
# Resultado: /build/dist/

# ─────────────────────────────────────────────
# Stage 2: Build del backend (Node.js + Express + TypeScript)
# ─────────────────────────────────────────────
FROM node:22-alpine AS backend-builder

WORKDIR /build

COPY server/package*.json ./
RUN npm ci --prefer-offline

COPY server/tsconfig.json ./
COPY server/src ./src

RUN npm run build
# Resultado: /build/dist/

# ─────────────────────────────────────────────
# Stage 3: Imagen de producción
# ─────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Solo dependencias de producción del backend
COPY server/package*.json ./
RUN npm ci --omit=dev --prefer-offline

# Código compilado del backend
COPY --from=backend-builder /build/dist ./dist

# Assets estáticos del frontend (Express los sirve en NODE_ENV=production)
# Quedan en /app/public → app.ts los busca en path.join(__dirname, '..', 'public')
COPY --from=frontend-builder /build/dist ./public

# Directorio para SQLite y archivos adjuntos (montado como volumen)
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
