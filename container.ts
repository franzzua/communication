import {Container} from "@hypertype/core";
import {CommunicationService, ContextService, DomainService, EventBus, MessageService} from "@services";
import {SolidService} from "@infr/solid";
import {YjsService} from "@infr/rtc";
import {ContextStore} from "./stores/context/context.store";
import {StateLogger} from "@hypertype/infr";

export const container = Container.withProviders(
    CommunicationService,
    ContextService,
    DomainService,
    EventBus,
    SolidService,
    YjsService,
    MessageService,
    ContextStore,
    StateLogger
)