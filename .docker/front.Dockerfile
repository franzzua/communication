FROM node:alpine as builder

WORKDIR /app

COPY .npmrc /app

RUN cat .npmrc
RUN npm i @franzzua/communication@latest

FROM nginx:alpine
LABEL authors="fransua"

WORKDIR "/app"
COPY --from=builder /app/node_modules/@franzzua/communication/dist/bundle/ /app
COPY nginx.conf /etc/nginx/conf.d/default.conf