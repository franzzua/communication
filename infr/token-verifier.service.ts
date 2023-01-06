import {importSPKI, jwtVerify} from "jose";
import { Api } from "./api";

export class TokenVerifier {
    constructor(private api: Api) {

    }

    private publicKey = this.api.fetch('/api/public-key').then(key => key.text()).then(key => importSPKI(key, 'ES512'));


    public async VerifyToken(token: string) {
        const {payload, protectedHeader} = await jwtVerify(token, await this.publicKey).catch(() => ({
            payload: null,
            protectedHeader: null
        }));
        return payload;
    }
}