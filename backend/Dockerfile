FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN mkdir -p uploads/images uploads/evidence

EXPOSE 5000

CMD ["node", "src/server.js"]
