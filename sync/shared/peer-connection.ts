import {EventEmitter} from "@cmmn/core";
import {UserInfo} from "./token-parser";

export abstract class PeerConnection extends EventEmitter<{
    [key in MessageType]: Uint8Array;
} & {
    close: void;
}> {
    constructor(public user: UserInfo, public incoming: boolean) {
        super();
    }

    public abstract send(type: MessageType, data: Uint8Array);

    public emit(type: MessageType | "close", data: Uint8Array | void) {
        if (this.user.accessMode == "read" && type == MessageType.Update) {
            console.warn(`User with read access should not update document`);
            return;
        }
        super.emit(type, data);
    }
    //
    // public disconnect(){
    //     super.dispose();
    // }
}

export type PeerDataChannelMessage = {}

export enum MessageType {
    UpdateRequest = 0,
    Update = 7,
    AwarenessRequest = 3,
    Awareness = 1,

    AddPeer = 4,
    RemovePeer = 5
};