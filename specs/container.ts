import { Container } from "@cmmn/core";
import { DomainContainer } from "@domain";
import { ResourceTokenStore } from "@infr/yjs/resource-token-store";

export function getTestContainer() {
    const container = Container.withProviders(
        ...DomainContainer.getProviders(),
        {
            provide: ResourceTokenStore, useValue: {
                GetToken() {
                    return 'ValidToken';
                }
            }
        }
    );
    return container;
}

export function clearMocks() {
}

