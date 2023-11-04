import {PeerConnection, MessageType} from "../../shared/index";

export class ChannelMock extends PeerConnection {
    private static instances = new Set<ChannelMock>();

    constructor() {
        super({accessMode: "write", user: "Bob"}, true);
        ChannelMock.instances.add(this);
    }


    public send(type: MessageType, data: Uint8Array) {
        for (let channel of ChannelMock.instances) {
            if (channel === this)
                continue;
            channel.emit(type, data);
        }
    }


}
