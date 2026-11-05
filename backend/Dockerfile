FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY database ./database
COPY aiven-ca.pem ./aiven-ca.pem

EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate && npm start"]
