import {Container} from "@hypertype/core";
import {
    AccountManager,
    ActionService,
    StorageService,
    ContextService,
    EventBus,
    LogService,
    MessageService,
    StateService
} from "@services";
import {ManagementService} from "./services/management.service";
import {DomainContainer} from "@domain";
import {InfrContainer} from "@infr/infr.container";

export const AppContainer = Container.withProviders(
    StorageService,
    ContextService,
    AccountManager,
    LogService,
    EventBus,
    ManagementService,
    MessageService,
    StateService,
    ActionService,
);

AppContainer.provide(DomainContainer);
AppContainer.provide(InfrContainer);
