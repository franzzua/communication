import {Container} from "@cmmn/core";
import {YjsRepository} from "@infr/yjs/yjsRepository";
import {ResourceTokenStore} from "@infr/yjs/resource-token-store";
import {ResourceTokenApi} from "@infr/resource-token-api.service";
import {TokenVerifier} from "@infr/token-verifier.service";

export const InfrContainer = Container.withProviders(
    YjsRepository, ResourceTokenStore, TokenVerifier, {
        provide: ResourceTokenApi, useValue: new ResourceTokenApi().withHeaders({
            'authorization': JSON.stringify({user: 'andrey'}),
        })
    }
)
