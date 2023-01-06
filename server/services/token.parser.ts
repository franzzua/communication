import {Injectable} from "@cmmn/core";
import {ResourceToken} from "@inhauth/core";
import {jwtVerify, SignJWT} from "jose";
import decode from "jwt-decode";
import {CryptoKeyStorage} from "./crypto-key-storage.service";

@Injectable()
export class TokenParser {

    constructor(private storage: CryptoKeyStorage) {
    }

    public async Parse<TokenType>(token: string): Promise<TokenType | null> {
        if (!token) return null;
        const isValid = await jwtVerify(token, await this.storage.getPublicKey(), {
            issuer: 'urn:example:issuer',
            audience: 'urn:example:audience',

        });
        if (!isValid)
            return null;
        const decrypted = decode(token);
        return decrypted as any as TokenType;
    }

    public async stringify<Token>(resultToken: Token): Promise<string> {
        return new SignJWT({
            ...resultToken,
            password: 'strokng password',
            version: 1
        }).setProtectedHeader({alg: this.storage.alg})
            .setIssuedAt()
            .setIssuer('urn:example:issuer')
            .setAudience('urn:example:audience')
            .setExpirationTime('2h')
            .sign(await this.storage.getPrivateKey())
    }
}