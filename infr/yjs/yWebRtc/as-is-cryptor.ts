import {Cryptor} from "@infr/yjs/yWebRtc/cryptor";

export class AsIsCryptor extends Cryptor {
    constructor() {
        super();
    }

    public async decrypt(data: Uint8Array): Promise<Uint8Array> {
        return data;
    }

    public async encrypt(data: Uint8Array): Promise<Uint8Array> {
        return data;
    }

}