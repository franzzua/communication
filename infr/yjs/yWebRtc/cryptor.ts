import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";

export abstract class Cryptor {
    abstract encrypt(data: ArrayBuffer): Promise<ArrayBuffer>;

    abstract decrypt(data: ArrayBuffer): Promise<ArrayBuffer>;


    async encryptJson(data: object): Promise<ArrayBuffer> {
        const dataEncoder = encoding.createEncoder()
        encoding.writeAny(dataEncoder, data)
        return this.encrypt(encoding.toUint8Array(dataEncoder));
    }

    async decryptJson(data: ArrayBuffer): Promise<any> {
        const buf = await this.decrypt(data);
        return decoding.readAny(decoding.createDecoder(new Uint8Array(buf)));
    }
}

