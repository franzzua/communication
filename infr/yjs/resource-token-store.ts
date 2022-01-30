export class ResourceTokenStore {
    private tokens = new Map<string, Promise<string>>();

    private async FetchToken(uri: string, parentURI: string) {
        const parentToken = await this.tokens.get(parentURI);
        const request = await fetch('/api/context?uri=' + uri, {
            headers: {
                'authorization': JSON.stringify({user: 'andrey'}),
                "Resource-Token": parentToken
            }
        });
        return request.ok && request.headers.get('ResourceToken');
    }

    public async GetToken(uri: string, parentURI: string): Promise<string> {
        return this.tokens.getOrAdd(uri, () => this.FetchToken(uri, parentURI));

    }
}