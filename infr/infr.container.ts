import {Container} from "@cmmn/core";
import {YjsRepository} from "@infr/yjs/yjsRepository";
import {ResourceTokenStore} from "@infr/yjs/resource-token-store";
import {ResourceTokenApi} from "@infr/resource-token-api.service";
import {TokenVerifier} from "@infr/token-verifier.service";
import {AccountManager} from "@infr/account.manager";

const acc = JSON.parse(localStorage.getItem('account'));

export const InfrContainer = () => Container.withProviders(
    YjsRepository, ResourceTokenStore, TokenVerifier, ResourceTokenApi,
    AccountManager
)
