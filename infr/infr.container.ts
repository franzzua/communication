import {Container} from "@hypertype/core";
import {YjsConnector} from "@infr/rtc";
import {SolidRepository} from "@infr/solid";
import {LocalRepository} from "@infr/local/local.repository";

export const InfrContainer = Container.withProviders(
    YjsConnector,
    SolidRepository,
    LocalRepository
)
