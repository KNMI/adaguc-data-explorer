FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci 
#--only=production

COPY . .

RUN npm run build

##### STAGE 2 #####

FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist dist

RUN npm install -g serve

CMD ["npx", "serve", "dist"]