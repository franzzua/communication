import type {SignalData, SimplePeer} from "simple-peer";
export type SignalMessage = {
    to: string;
    from: UserInfo;
    room: string;
    type: 'signal';
    signal: SignalData;
};

export type SignalingRegistrationInfo = {
    room: string;
    token: string;
}

export type SignalingRegisterMessage = {
    type: 'register';
    info: SignalingRegistrationInfo;
};

export type AnnounceMessage = {
    room: string;
    type: 'announce';
    users: UserInfo[];
}

export type UserInfo = {
    user: string;
    accessMode: 'read' | 'write';
}

export type SignalingMessage = SignalingRegisterMessage | SignalMessage;
export type SignalingServerMessage = SignalMessage | AnnounceMessage;