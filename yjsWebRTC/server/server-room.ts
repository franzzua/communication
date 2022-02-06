import {ClientConnection} from "./client-connection";

export class ServerRoom {
    private users: ClientConnection[] = [];

    constructor(private name: string) {

    }


    public addClient(connection: ClientConnection) {
        this.users.forEach(c => c.send({
            type: "announce",
            room: this.name,
            users: [connection.userInfo]
        }));
        connection.send({
            type: "announce",
            room: this.name,
            users: this.users.map(x => x.userInfo)
        })
        this.users.push(connection);
    }

}

// export class YWebrtcHandler {
//     /**
//      * Map froms topic-name to set of subscribed clients.
//      * @type {Map<string, Set<any>>}
//      */
//     private static topics = new Map<string, Map<string, { conn: WebSocket, accessModel: AccessMode }>>()
//     private subscribedTopics = new Set<string>()
//     private closed = false;
//     // Check if connection is still alive
//     private onClosed: Function;
//     public live = new Promise(resolve => this.onClosed = resolve);
//
//     constructor(private conn: WebSocket, private controller: YjsWebrtcController) {
//     }
//
//     private publish(message) {
//         const receivers = YWebrtcHandler.topics.get(message.topic)
//         if (receivers) {
//             receivers.forEach(receiver => {
//                 if (receiver === this.conn)
//                     return;
//                 YWebrtcHandler.send(receiver, message)
//             })
//         }
//     }
//
//     private unsubscribe(topics) {
//         for (const topicName of topics) {
//             const subs = YWebrtcHandler.topics.get(topicName)
//             if (subs) {
//                 subs.delete(this.conn);
//             }
//         }
//     }
//
//     /**
//      * @param {any} conn
//      * @param {object} message
//      */
//     private static send = (conn, message) => {
//         if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
//             conn.close()
//         }
//         try {
//             conn.send(JSON.stringify(message))
//         } catch (e) {
//             conn.close()
//         }
//     }
//
//
//     @bind
//     public close() {
//         this.subscribedTopics.forEach(topicName => {
//             const subs = YWebrtcHandler.topics.get(topicName) || new Set()
//             subs.delete(this.conn)
//             if (subs.size === 0) {
//                 YWebrtcHandler.topics.delete(topicName)
//             }
//         })
//         this.subscribedTopics.clear()
//         this.closed = true
//         this.onClosed();
//     }
//
//     @bind
//     public handleMessage(msg) {
//         const messageStr = (msg as Buffer).toString('utf8');
//         const message = JSON.parse(messageStr) as SignalingMessage;
//         if (!message?.type || this.closed) {
//             return;
//         }
//         switch (message.type) {
//             case 'register':
//                 this.register(message.info.room, message.info.token);
//                 break
//             case 'unsubscribe':
//                 this.unsubscribe(message.topics);
//                 break
//             case 'publish':
//                 this.publish(message)
//                 break
//             case 'ping':
//                 YWebrtcHandler.send(this.conn, {type: 'pong'})
//         }
//     }
//
// }

const wsReadyStateConnecting = 0
const wsReadyStateOpen = 1
const wsReadyStateClosing = 2 // eslint-disable-line
const wsReadyStateClosed = 3 // eslint-disable-line

