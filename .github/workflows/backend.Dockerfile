FROM node:alpine as builder

WORKDIR /app

COPY .npmrc /app

RUN npm i @franzzua/communication@latest

FROM node:alpine
LABEL authors="fransua"

WORKDIR "/app"
COPY --from=builder /app/node_modules/@franzzua/communication/dist/bundle/server.min.js /app/server.mjs
COPY --from=builder /app/node_modules /app/node_modules
ENV PORT=80
ENTRYPOINT ["node", "server.mjs"]