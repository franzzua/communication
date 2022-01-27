import {bind} from "@cmmn/core";
import * as map from "lib0/map.js";
import type {WebSocket} from "ws";

export class YWebrtcHandler {
    /**
     * Map froms topic-name to set of subscribed clients.
     * @type {Map<string, Set<any>>}
     */
    private static topics = new Map()
    private subscribedTopics = new Set()
    private closed = false;
    // Check if connection is still alive
    private onClosed: Function;
    public live = new Promise(resolve => this.onClosed = resolve);

    constructor(private conn: WebSocket, private auth?: (topic: string, token: string) => Promise<boolean>) {
        this.listenPingPong();
        this.conn.on('close', this.onClose);
        this.conn.on('message', this.onMessage);
    }

    private publish(message) {
        const receivers = YWebrtcHandler.topics.get(message.topic)
        if (receivers) {
            receivers.forEach(receiver =>
                YWebrtcHandler.send(receiver, message)
            )
        }
    }

    private unsubscribe(topics) {
        for (const topicName of topics) {
            const subs = YWebrtcHandler.topics.get(topicName)
            if (subs) {
                subs.delete(this.conn);
            }
        }
    }

    private async subscribe(topics) {
        for (let {name, token} of topics) {
            if (this.auth && !(await this.auth(name, token))){
                continue;
            }
            const topics = YWebrtcHandler.topics.getOrAdd(name, () => new Set());
            topics.add(this.conn)
            this.subscribedTopics.add(name)
        }
    }

    /**
     * @param {any} conn
     * @param {object} message
     */
    private static send = (conn, message) => {
        if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
            conn.close()
        }
        try {
            conn.send(JSON.stringify(message))
        } catch (e) {
            conn.close()
        }
    }


    private listenPingPong(){
        let pongReceived = true;
        const pingInterval = setInterval(() => {
            if (!pongReceived) {
                this.conn.close()
                clearInterval(pingInterval)
            } else {
                pongReceived = false
                try {
                    this.conn.ping()
                } catch (e) {
                    this.conn.close()
                }
            }
        }, pingTimeout)
        this.conn.on('pong', () => {
            pongReceived = true
        })
    }

    @bind
    private onClose(){
        this.subscribedTopics.forEach(topicName => {
            const subs = YWebrtcHandler.topics.get(topicName) || new Set()
            subs.delete(this.conn)
            if (subs.size === 0) {
                YWebrtcHandler.topics.delete(topicName)
            }
        })
        this.subscribedTopics.clear()
        this.closed = true
        this.onClosed();
    }

    @bind
    private onMessage(msg) {
        const messageStr = (msg as Buffer).toString('utf8');
        const message = JSON.parse(messageStr) as { type; topics; topic; data; };
        if (!message?.type || this.closed) {
            return;
        }
        switch (message.type) {
            case 'subscribe':
                this.subscribe(message.topics);
                break
            case 'unsubscribe':
                this.unsubscribe(message.topics);
                break
            case 'publish':
                this.publish(message)
                break
            case 'ping':
                YWebrtcHandler.send(this.conn, {type: 'pong'})
        }
    }

}

const wsReadyStateConnecting = 0
const wsReadyStateOpen = 1
const wsReadyStateClosing = 2 // eslint-disable-line
const wsReadyStateClosed = 3 // eslint-disable-line

const pingTimeout = 30000
