FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY database ./database
COPY aiven-ca.pem ./aiven-ca.pem

EXPOSE 3000

CMD ["sh", "-c", "echo '[startup] Database migration started'; (npm run db:migrate && echo '[startup] Database migration completed' || echo '[startup] Database migration failed') & exec npm start"]
