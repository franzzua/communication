import {Injectable} from "@cmmn/core";
import {Api} from "@infr/api";
import {TokenCryptor} from "@infr/yjs/token-cryptor";
import {TokenVerifier} from "@infr/token-verifier.service";


@Injectable()
export class ResourceTokenApi extends Api {
    private tokens = new Map<string, Promise<string>>();
    private passwords = new Map<string, { version; password; }>();


    private async FetchToken(uri: string) {
        const request = await this.fetch('/api/context?uri=' + uri);
        if (!request.ok)
            return null;
        const token = request.headers.get('ResourceToken');
        this.passwords.set(uri, {version: 1, password: 'hi'})
        return token;
    }

    public async GetToken(uri: string) {
        const token = await this.tokens.getOrAdd(uri, () => this.FetchToken(uri));
        return token;
    }

    public withParentURI(parentURI: string): ResourceTokenApi {
        const token = this.GetToken(parentURI);
        return super.withHeaders(token.then(t => ({
            "Resource-Token": t
        })));
    }


    public getCryptor(URI: string) {
        return new TokenCryptor(URI, this, new TokenVerifier(this));
    }
}

