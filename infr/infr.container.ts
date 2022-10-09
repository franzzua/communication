import {Container} from "@cmmn/core";
import {YjsRepository} from "@infr/yjs/yjsRepository";
import {ResourceTokenStore} from "@infr/yjs/resource-token-store";

export const InfrContainer = () => Container.withProviders(
    YjsRepository, ResourceTokenStore
)
