import {Container} from "@hypertype/core";
import {YjsConnector} from "@infr/rtc";
import {SolidRepository} from "@infr/solid";
import {LocalRepository} from "@infr/local/local.repository";
import {SolidMockRepository} from "@infr/local/solid-mock.repository";

export const InfrContainer = Container.withProviders(
    YjsConnector,
    SolidRepository,
    SolidMockRepository,
    LocalRepository
)
