import {ContextJSON, StorageJSON} from "@domain";
import {ContextStore} from "./contextStore";
import {ResourceTokenStore} from "@infr/yjs/resource-token-store";
import {bind, Injectable} from "@cmmn/core";
import {ResourceTokenApi} from "@infr/resource-token-api.service";
import {WebRtcProvider} from "@cmmn/sync/webrtc/client";
import { ISyncProvider, LocalSyncProvider } from "@cmmn/sync";

@Injectable()
export class YjsRepository {

    private map = new Map<string, ContextStore>();

    public Provider = new WebRtcProvider(
        [`${location.origin.replace(/^http/, 'ws')}/api`],
    );

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
        return this.map.getOrAdd(uri, uri => {
            const store = new ContextStore(uri);
            this.getProviders(uri, parentURI).then(async providers => {
                for (let provider of providers) {
                    await store.syncWith(provider);
                }
                await store.Init()
            });
            return store;
        });
    }

    async Load(uri: string = null): Promise<StorageJSON> {
        return new Promise<StorageJSON>(r => ({}));
    }

    @bind
    private createContextStore(uri){
    }

    private async getProviders(uri: string, parentURI: string): Promise<ISyncProvider[]>{
        const token = await this.api.GetToken(uri, parentURI);
        const room = this.Provider.joinRoom(uri, {
            token: token,
            user: this.api.GetUserInfo().id
        });
        return [
            new LocalSyncProvider(uri),
            room
        ];
    }

}
