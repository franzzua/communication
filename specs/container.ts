import { Container } from "@cmmn/core";
import { DomainContainer } from "@domain";
import { ResourceTokenStore } from "@infr/yjs/resource-token-store";
import { DomainLocator } from "@domain/model/domain-locator.service";
import { Locator, proxy, useStreamDomain } from "@cmmn/domain/proxy";
import { DomainProxy } from "@services";
import {InfrContainer} from "@infr/infr.container";
import {DomainState} from "@model";

export function getTestContainer() {
    const container = Container.withProviders(
        ...DomainContainer().getProviders(),
        ...InfrContainer().getProviders(),
        {
            provide: ResourceTokenStore, useValue: {
                GetToken() {
                    return 'ValidToken';
                }
            },
        },
        { provide: Locator, useFactory: cont => cont.get(DomainLocator) },
        ...useStreamDomain().getProviders(),
        DomainProxy
    );
    return container;
}

export function clearMocks() {
    proxy.clear();
}

