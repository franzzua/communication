import {Awareness} from "y-protocols/awareness";
import {Doc} from "yjs";
import {YjsWebRTCProvider} from "./yjs-webrtc.provider";
import {Options, SignalData} from "simple-peer";
import {AnnounceMessage, SignalingRegistrationInfo, UserInfo} from "../shared/types";
import {PeerConnection} from "./peer-connection";

export class Room {
    private users = new Map<UserInfo["user"], UserInfo["accessMode"]>();

    constructor(private roomName: string,
                private doc: Doc,
                private options: RoomOptions,
                private provider: YjsWebRTCProvider) {

    }


    public getRegistrationInfo(): SignalingRegistrationInfo {
        return {
            room: this.roomName,
            token: this.options.token
        }
    }

    public async connect() {

    }

    public async disconnect() {

    }

    public signal(user: UserInfo, signal: SignalData) {
        const connection = PeerConnection.answer(user, signal, this.options.peerOpts);
    }

    public addUsers(users: UserInfo[]) {
        for (let user of users) {
            this.users.set(user.user, user.accessMode);
            const connection = PeerConnection.initiate(user, this.options.peerOpts);
        }
    }
}


export type RoomOptions = {
    awareness?: Awareness;
    token?: string;
    maxConnections?: number;
    useBroadcast?: boolean;
    peerOpts?: Options;
}

