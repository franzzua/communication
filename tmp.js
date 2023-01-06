import wsPlugin from 'fastify-websocket';
import fastify from 'fastify';

const server = fastify();
server.register(wsPlugin)
server.register(async function (fastify) {
    server.get('/api', { websocket: true, exposeHeadRoute: false }, (connection /* SocketStream */, req /* FastifyRequest */) => {
        connection.socket.on('message', message => {
            // message.toString() === 'hi from client'
            connection.socket.send('hi from server')
        })
    })
})

server.listen({ port: 4004 })