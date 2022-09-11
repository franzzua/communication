import {StorageJSON} from "@domain";
import {ContextStore} from "./contextStore";
import {ResourceTokenStore} from "@infr/yjs/resource-token-store";
import {Injectable} from "@cmmn/core";

@Injectable()
export class YjsRepository {

    private map = new Map<string, ContextStore>();

    constructor(private tokenStore: ResourceTokenStore) {
    }

    State$ = null;

    async Clear(): Promise<void> {
        ContextStore.clear()
    }

    // LoadContext(uri: string, parentURI: string): ContextStore {
    //     return this.GetOrAdd(uri, parentURI);
    // }

    public GetOrAdd(uri: string, parentURI: string): ContextStore {
        const token = this.tokenStore.GetToken(uri, parentURI);
        return this.map.getOrAdd(uri, uri => new ContextStore(uri, token));
    }

    async Load(uri: string = null): Promise<StorageJSON> {
        return new Promise<StorageJSON>(r => ({}));
    }

}
