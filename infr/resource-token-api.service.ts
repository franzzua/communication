import {Injectable} from "@cmmn/core";
import {Api} from "@infr/api";
import {TokenCryptor} from "@infr/yjs/token-cryptor";
import {TokenVerifier} from "@infr/token-verifier.service";


export class ResourceTokenApi extends Api {
    private tokens = new Map<string, Promise<string>>();
    private passwords = new Map<string, { version; password; }>();


    private async FetchToken(uri: string, parentURI?: string) {
        const parentToken = parentURI ? await this.GetToken(parentURI) : undefined;
        const request = await this.fetch('/api/context?uri=' + uri, {
            headers: parentURI ? {
                "Resource-Token": parentToken
            } : {}
        });
        if (!request.ok)
            return null;
        const token = request.headers.get('ResourceToken');
        this.passwords.set(uri, {version: 1, password: 'hi'})
        return token;
    }

    public async GetToken(uri: string, parentURI?: string) {
        const token = await this.tokens.getOrAdd(uri, () => this.FetchToken(uri, parentURI));
        return token;
    }
    //
    // public withParentURI(parentURI: string): ResourceTokenApi {
    //     const token = this.GetToken(parentURI);
    //     return super.withHeaders(token.then(t => ({
    //         "Resource-Token": t
    //     })));
    // }


    public getCryptor(URI: string) {
        return new TokenCryptor(URI, this, new TokenVerifier(this));
    }
}

