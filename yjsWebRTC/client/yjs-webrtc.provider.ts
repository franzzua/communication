import type {Doc} from "yjs";
import {SignalingConnection} from "./signaling-connection";
import {bind} from '@cmmn/core';
import {AnnounceMessage, SignalMessage} from "../shared/types";
import {Room, RoomOptions} from "./room";

export class YjsWebRTCProvider {
    private readonly signalingConnections: ReadonlyArray<SignalingConnection>;
    private readonly rooms: Map<string, Room> = new Map<string, Room>();

    constructor(
        signallingServers: string[],
    ) {
        this.signalingConnections = signallingServers.map(this.createSignallingConnection)
    }

    public async joinRoom(roomName: string, doc: Doc, options: RoomOptions = {}) {
        const room = new Room(roomName, doc, options, this);
        this.rooms.set(roomName, room);
        const regInfo = room.getRegistrationInfo();
        this.signalingConnections.forEach(x => x.register(regInfo));
        await room.connect();
    }

    public async leaveRoom(roomName: string) {
        await this.rooms.get(roomName).disconnect();
    }

    @bind
    private onSignal(msg: SignalMessage) {
        this.rooms.get(msg.room).signal(msg.from, msg.signal);
    }
    @bind
    private onAnnounce(room: string, users: AnnounceMessage["users"]) {
        this.rooms.get(room).addUsers(users);
    }

    /** @internal **/
    public sendSignal(msg: SignalMessage) {
        this.signalingConnections.forEach(s => s.sendSignal(msg));
    }

    @bind
    private createSignallingConnection(url: string): SignalingConnection {
        const connection = new SignalingConnection(url, this);
        connection.on('signal', this.onSignal);
        connection.on('announce', this.onAnnounce);
        return connection;
    }

}

