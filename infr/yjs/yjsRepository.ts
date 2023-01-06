import {StorageJSON} from "@domain";
import {ContextStore} from "./contextStore";
import {ResourceTokenStore} from "@infr/yjs/resource-token-store";
import {Injectable} from "@cmmn/core";
import {Api} from "@infr/api";
import {ResourceTokenApi} from "@infr/resource-token-api.service";

@Injectable()
export class YjsRepository {

    private map = new Map<string, ContextStore>();

    constructor(private tokenStore: ResourceTokenStore,
                private api: ResourceTokenApi) {
    }

    State$ = null;

    async Clear(): Promise<void> {
        ContextStore.clear()
    }

    LoadContext(uri: string, parentURI: string): ContextStore {
        return this.GetOrAdd(uri, parentURI);
    }

    GetOrAdd(uri: string, parentURI): ContextStore {
        const api = this.api.withParentURI(parentURI);
        return this.map.getOrAdd(uri, uri => new ContextStore(uri, api));
    }

    async Load(uri: string = null): Promise<StorageJSON> {
        return new Promise<StorageJSON>(r => ({}));
    }

}
