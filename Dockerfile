## ESTÁGIO 1: BUILDER Compilação/Transpilação
FROM node:22-alpine AS builder

# Prisma Client precisa da biblioteca openssl no Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

# Copia os arquivos de dependências e a pasta do Prisma primeiro
# Isso faz o Docker usar cache e não reinstalar tudo se você só mudar um arquivo .ts
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instala TODAS as dependências (incluindo tsup, typescript, vitest, etc)
RUN npm ci

# Copia o resto do código fonte
COPY . .

# Roda o comando de build do seu package.json
# Isso executa "npx prisma generate" e "tsup src/server.ts src/worker.ts"
RUN npm run build


# ESTÁGIO 2: RUNNER Produção
FROM node:22-alpine AS runner

# Instala o openssl para a imagem final também
RUN apk add --no-cache openssl

WORKDIR /app

# Define que o ambiente é puramente de produção
ENV NODE_ENV=production

# Copia novamente apenas os arquivos necessários para gerenciar dependências
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instala APENAS dependências de produção (ignora tsup, types, etc.)
RUN npm ci --omit=dev

# Gera a engine do Prisma compilada especificamente para esta imagem final
RUN npx prisma generate

# Copia a pasta "dist" do estágio anterior
COPY --from=builder /app/dist ./dist

# Expõe a porta que a API vai utilizar
EXPOSE 3000

# inicia a API)
# O serviço "worker" no docker-compose sobrescreve isso com "npm run start:worker"
CMD ["npm", "start"]