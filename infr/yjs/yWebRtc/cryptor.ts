import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";

export abstract class Cryptor {
    abstract encrypt(data: Uint8Array): Promise<Uint8Array>;

    abstract decrypt(data: Uint8Array): Promise<Uint8Array>;


    async encryptJson(data: object): Promise<any> {
        const dataEncoder = encoding.createEncoder()
        encoding.writeAny(dataEncoder, data)
        return this.encrypt(encoding.toUint8Array(dataEncoder));
    }

    async decryptJson(data: Uint8Array): Promise<any> {
        const buf = await this.decrypt(data);
        return decoding.readAny(decoding.createDecoder(buf));
    }
}

