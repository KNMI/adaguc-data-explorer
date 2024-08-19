FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci 
#--only=production

COPY . .

RUN npm run build

##### STAGE 2 #####

FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html

COPY --from=builder /usr/src/app/dist .

EXPOSE 80

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

ENV ADAGUC_AUTOWMS_ENDPOINT="http://localhost:8090/adaguc-services/autowms?"

CMD ["nginx","-g","daemon off;"]