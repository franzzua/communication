import { Injectable } from "@cmmn/core";
import { Api, Request } from "@cmmn/infr";

@Injectable()
export class ResourceTokenStore {
    constructor(private api: Api) {
    }

    private tokens = new Map<string, Promise<string>>();

    private async FetchToken(uri: string, parentURI: string) {
        const parentToken = parentURI && await this.tokens.get(parentURI);
        const request = await Request.fetch('/api/context?uri=' + uri, {
            headers: {
                'authorization': JSON.stringify({ user: 'andrey' }),
                "Resource-Token": parentToken
            }
        });
        if (!request.ok)
            return null;
        const token = request.headers.get('ResourceToken');
        return token;
    }

    public GetToken(uri: string, parentURI: string): Promise<string> {
        const res = this.tokens.getOrAdd(uri, () => this.FetchToken(uri, parentURI));
        res['hi'] = 'hi';
        return res;
    }
}