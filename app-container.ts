import {Container} from "@hypertype/core";
import {
    AccountManager,
    ActionService,
    StorageService,
    ContextService,
    EventBus,
    LogService,
    MessageService,
    StateService, ProxyProvider
} from "@services";
import {ManagementService} from "./services/management.service";
import {ProxyDomainContainer} from "@hypertype/domain";
import {InfrContainer} from "@infr/infr.container";
import {DomainContainer} from "@domain";
import {RouterService} from "./app/services/router.service";

export const AppContainer = Container.withProviders(
    StorageService,
    RouterService,
    ContextService,
    AccountManager,
    LogService,
    EventBus,
    ManagementService,
    MessageService,
    ActionService,
    ProxyProvider,
);

AppContainer.provide(DomainContainer);
AppContainer.provide(ProxyDomainContainer.withSimple(true));
AppContainer.provide(InfrContainer);
