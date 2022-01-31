import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import {MessageType} from "@infr/yjs/yWebRtc/room";
import {Decoder} from "lib0/decoding";

export class MessageSerializer {

    constructor(private doc, private awareness) {
    }

    public writeSync1(decoder: Decoder) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MessageType.Sync2);
        syncProtocol.readSyncStep1(decoder, encoder, this.doc);
        return encoding.toUint8Array(encoder);
    }

    public writeSync2(decoder: Decoder) {
        syncProtocol.readSyncStep2(decoder, this.doc, this);
    }

    public writeAwareness(decoder: Decoder) {
        awarenessProtocol.applyAwarenessUpdate(this.awareness, decoding.readVarUint8Array(decoder), this)
    }

    public writeUpdate(decoder: Decoder) {
        syncProtocol.readUpdate(decoder, this.doc, this);
    }

    public getSync1Message() {
        const encoderSync = encoding.createEncoder()
        encoding.writeVarUint(encoderSync, MessageType.Sync1)
        syncProtocol.writeSyncStep1(encoderSync, this.doc)
        return encoding.toUint8Array(encoderSync);
    }

    public getSync2Message() {
        const encoderState = encoding.createEncoder()
        encoding.writeVarUint(encoderState, MessageType.Sync2)
        syncProtocol.writeSyncStep2(encoderState, this.doc)
        return encoding.toUint8Array(encoderState);
    }

    public getAwarenessMessage(changedClients = [this.doc.clientID]) {
        const encoderAwarenessState = encoding.createEncoder()
        encoding.writeVarUint(encoderAwarenessState, MessageType.Awareness)
        encoding.writeVarUint8Array(encoderAwarenessState, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients))
        return encoding.toUint8Array(encoderAwarenessState);
    }

    public getQueryAwarenessMessage() {
        const encoderAwarenessQuery = encoding.createEncoder()
        encoding.writeVarUint(encoderAwarenessQuery, MessageType.QueryAwareness)
        return encoding.toUint8Array(encoderAwarenessQuery);
    }


    public getUpdate(update) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MessageType.SyncUpdate);
        syncProtocol.writeUpdate(encoder, update);
        return encoding.toUint8Array(encoder);
    }
}