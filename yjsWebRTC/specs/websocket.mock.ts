import {Observable} from "lib0/observable";

export class WebsocketMock extends Observable<any> {

    private clients: WebsocketMock[] = [];

    constructor() {
        super();
    }

    public set onopen(fn){
        setTimeout(fn, 100);
    }

    public set onmessage(fn){
        this.on('message', x => fn({data: x}));
    }
    public async send(data) {
        await new Promise(resolve => setTimeout(resolve, 100));
        this.clients.forEach(client => client.emit('message', [data]));
    }

    public close() {
        this.clients.forEach(client => client.emit('close', []));
    }

    public static createPair() {
        const server = new WebsocketMock();
        const client = new WebsocketMock();
        server.clients.push(client);
        client.clients.push(server);
        return {client, server};
    }
}

