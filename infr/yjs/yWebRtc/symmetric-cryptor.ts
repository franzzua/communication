import * as string from "lib0/string";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import {Cryptor} from "@infr/yjs/yWebRtc/cryptor";

export class SymmetricCryptor extends Cryptor {
    private readonly key: PromiseLike<CryptoKey>;

    constructor(private password: string, private roomName: string) {
        super();
        this.key = this.deriveKey(password, this.roomName);
    }

    private deriveKey(secret, roomName) {
        const secretBuffer = string.encodeUtf8(secret).buffer
        const salt = string.encodeUtf8(roomName).buffer
        return crypto.subtle.importKey(
            'raw',
            secretBuffer,
            'PBKDF2',
            false,
            ['deriveKey']
        ).then(keyMaterial =>
            crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true,
                ['encrypt', 'decrypt']
            )
        )
    }

    public async decrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
        const dataDecoder = decoding.createDecoder(new Uint8Array(data));
        const algorithm = decoding.readVarString(dataDecoder)
        if (algorithm !== 'AES-GCM') {
            Promise.reject(new Error('Unknown encryption algorithm'))
        }
        const iv = decoding.readVarUint8Array(dataDecoder)
        const cipher = decoding.readVarUint8Array(dataDecoder);
        const decrypted: ArrayBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv
            },
            await this.key,
            cipher
        );
        return new Uint8Array(decrypted)
    }

    public async encrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const cipher = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv
            },
            await this.key,
            data
        );
        const encryptedDataEncoder = encoding.createEncoder()
        encoding.writeVarString(encryptedDataEncoder, 'AES-GCM')
        encoding.writeVarUint8Array(encryptedDataEncoder, iv)
        encoding.writeVarUint8Array(encryptedDataEncoder, new Uint8Array(cipher))
        return encoding.toUint8Array(encryptedDataEncoder)
    }

}