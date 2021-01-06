import {Container} from "@hypertype/core";
import {
    AccountManager,
    ActionService,
    StorageService,
    ContextService,
    DomainService,
    EventBus,
    LogService,
    MessageService,
    StateService
} from "@services";
import {YjsRepository} from "@infr/rtc/yjsRepository";
import {SolidRepository} from "@infr/solid";
import {ManagementService} from "./services/management.service";
import {PersistanceService} from "@infr/persistance.service";


export const DomainContainer = Container.withProviders(
    StorageService,
    ContextService,
    AccountManager,
    DomainService,
    LogService,
    EventBus,
    ManagementService,
    PersistanceService,
    YjsRepository,
    SolidRepository,
    MessageService,
    StateService,
    ActionService,
)