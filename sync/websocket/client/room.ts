import {WebsocketConnection} from "./websocket-connection";
import {DataConnection} from "./data-connection";
import {DocAdapter} from "../../shared/doc-adapter";
import {ISyncProvider} from "../../shared/provider";

export class Room implements ISyncProvider{
    private adapters = new Set<DocAdapter>();
    private dataConnection = new DataConnection(this.connection, this.roomName);

    constructor(private connection: WebsocketConnection,
                private roomName: string) {
    }


    public addAdapter(docAdapter: any) {
        docAdapter.connect(this.dataConnection);
        this.adapters.add(docAdapter);
    }
}

