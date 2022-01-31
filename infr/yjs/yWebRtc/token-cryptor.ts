import {SymmetricCryptor} from "./symmetric-cryptor";

export class TokenCryptor extends SymmetricCryptor {
    private token: Uint8Array;

    constructor(password, room, token: string) {
        super(password, room);
        const enc = new TextEncoder();
        this.token = enc.encode(token);
    }

    private checkToken(token: string): boolean {
        console.log(token);
        return true;
    }

    public async decrypt(data: Uint8Array): Promise<Uint8Array> {
        const decrypted = await super.decrypt(data);
        const length = decrypted[0] + (decrypted[1] << 8);
        const token = decrypted.slice(2, length + 2);
        const dec = new TextDecoder();
        const tokenStr = dec.decode(token);
        if (!this.checkToken(tokenStr))
            throw new Error()
        return decrypted.slice(length + 2);
    }

    public async encrypt(data: Uint8Array): Promise<Uint8Array> {
        const result = new Uint8Array(this.token.length + data.length + 2);
        result[0] = this.token.length;
        result[1] = this.token.length >> 8;
        result.set(this.token, 2);
        result.set(data, this.token.length + 2);
        return super.encrypt(result);
    }

}