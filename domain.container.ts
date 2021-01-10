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
import {SolidRepository} from "@infr/solid";
import {ManagementService} from "./services/management.service";
import {PersistanceService} from "@infr/persistance.service";
import {YjsConnector} from "@infr/rtc";


export const DomainContainer = Container.withProviders(
    YjsConnector,
    StorageService,
    ContextService,
    AccountManager,
    LogService,
    EventBus,
    ManagementService,
    PersistanceService,
    SolidRepository,
    MessageService,
    StateService,
    ActionService,
)