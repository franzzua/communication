import {SymmetricCryptor} from "./yWebRtc/symmetric-cryptor";
import {Cryptor} from "@infr/yjs/yWebRtc/cryptor";
import {ResourceTokenApi} from "@infr/resource-token-api.service";
import {TokenVerifier} from "@infr/token-verifier.service";

export class TokenCryptor extends Cryptor {
    private token = this.api.GetToken(this.uri);

    private baseCryptor = Promise.all([
        this.token,
        this.getSymmetric()
    ]).then(([token, cryptor]) => new TokenCryptorBase(token, cryptor));

    constructor(private uri,
                private api: ResourceTokenApi,
                private tokenVerifier: TokenVerifier) {
        super();
    }

    private async getPassword() {
        return 'super secure';
    }

    private async getSymmetric(): Promise<SymmetricCryptor> {
        const password = await this.getPassword()
        return new SymmetricCryptor(password, this.uri)
    }

    private async checkToken(token: string): Promise<boolean> {
        const payload = await this.tokenVerifier.VerifyToken(token);
        console.log(payload);
        return true;
    }

    public async decrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
        const base = await this.baseCryptor;
        const {token, result} = await base.decrypt(data);
        if (!await this.checkToken(token))
            throw new Error()
        return result;
    }

    public async encrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
        const base = await this.baseCryptor;
        return base.encrypt(data);
    }

}

export class TokenCryptorBase {
    private readonly encodedToken: Uint8Array;

    constructor(token: string,
                private baseCryptor: Cryptor,
    ) {
        const encoder = new TextEncoder();
        this.encodedToken = encoder.encode(token);
    }


    public async decrypt(data: ArrayBuffer): Promise<{ token: string; result: ArrayBuffer }> {
        const decrypted = await this.baseCryptor.decrypt(data);
        const length = decrypted[0] + (decrypted[1] << 8);
        const token = decrypted.slice(2, length + 2);
        const dec = new TextDecoder();
        const tokenStr = dec.decode(token);
        return {token: tokenStr, result: decrypted.slice(length + 2)};
    }

    public async encrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
        const encodedToken = await this.encodedToken;
        const result = new Uint8Array(encodedToken.length + data.byteLength + 2);
        result[0] = encodedToken.length;
        result[1] = encodedToken.length >> 8;
        result.set(encodedToken, 2);
        result.set(new Uint8Array(data), encodedToken.length + 2);
        return this.baseCryptor.encrypt(result);
    }

}