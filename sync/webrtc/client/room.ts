import {
    DocAdapter,
    Network,
    networkFactory,
    ConnectionDirection,
    PeerConnection,
    ConnectionProvider,
    ISyncProvider
} from "../../shared";
import {EventEmitter} from "@cmmn/core";
import {SignalingRegistrationInfo, UserInfo} from "../shared/types";
import {SignalingConnection} from "./signaling-connection";

export class Room extends EventEmitter<{
    network: Network
}> implements ISyncProvider {
    private signalConnections = new Set<SignalingConnection>();
    private connections = new Set<PeerConnection>();
    private adapters = new Set<DocAdapter>();

    public network: Network;
    private users: UserInfo[] = [];

    constructor(private roomName: string, private options: RoomOptions, private peerFactory: ConnectionProvider) {
        super();
    }

    /** @internal **/
    public addSignalingConnection(connection: SignalingConnection) {
        if (this.signalConnections.has(connection)) {
            return;
        }
        this.signalConnections.add(connection);
        connection.on('connected', () => {
            connection.register(this.getRegistrationInfo());
        });
        connection.once('disconnected', () => {
            // disconnected from server... but connected to users? ok.
        });
        if (connection.isConnected) {
            connection.register(this.getRegistrationInfo());
        }
    }

    private getRegistrationInfo(): SignalingRegistrationInfo {
        return {
            room: this.roomName, token: this.options.token
        }
    }

    /** @internal **/
    public async setUsers(users: UserInfo[]) {
        this.users = users;
        const usersMap = new Map(users.map(x => [x.user, x]));
        this.network = networkFactory(this.options.user, Array.from(usersMap.keys()));
        this.onNetworkUpdate();
        this.emit('network', this.network);
    }

    private onNetworkUpdate() {
        const usersMap = new Map(this.users.map(x => [x.user, x]));
        for (let connection of this.connections.values()) {
            const connected = this.network.isConnectedTo(connection.user.user);
            if (!connected) {
                connection.dispose();
                this.connections.delete(connection);
            }
        }
        const connectedUsers = new Set(Array.from(this.connections).map(x => x.user.user));
        this.network.map.forEach((connection, user) => {
            if (connection.direction == ConnectionDirection.out && !connectedUsers.has(user)) {
                this.connectTo(usersMap.get(user));
            }
        });
    }

    private async connectTo(user: UserInfo) {
        const connection = await this.peerFactory.connectTo(user, this.roomName, this.options.user)
        return this.addConnection(connection);
    }

    /** @internal **/
    public addConnection(connection: PeerConnection) {
        connection.on('close', () => {
            for (let adapter of this.adapters) {
                adapter.disconnect(connection);
            }
            if (this.network.isConnectedTo(connection.user.user)) {
                this.network.setDisconnected(connection.user.user, connection.incoming);
            }
            this.connections.delete(connection);
            if (!connection.incoming && this.network.isConnectedTo(connection.user.user)) {
                this.connectTo(connection.user);
            }
        })
        this.connections.add(connection);
        for (let adapter of this.adapters) {
            adapter.connect(connection);
            console.log('connect', connection);
        }
        this.network.setConnected(connection.user.user, connection.incoming);
        return connection;
    }

    /** @internal **/
    public addAdapter(docAdapter: DocAdapter) {
        for (let connection of this.connections) {
            docAdapter.connect(connection);
        }
        docAdapter.on('dispose', () => {
            this.adapters.delete(docAdapter);
            for (let connection of this.connections) {
                docAdapter.disconnect(connection);
            }
        })
        this.adapters.add(docAdapter);
    }

    public disconnect() {
        for (let connection of this.connections) {
            for (let adapter of this.adapters) {
                adapter.disconnect(connection);
            }
        }
    }
}


export type RoomOptions = {
    token?: string; user: string; maxConnections?: number; useBroadcast?: boolean; peerOpts?: RTCConfiguration;
}
