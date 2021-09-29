import {Container} from "@hypertype/core";
// import {YjsConnector} from "@infr/rtc";
// import {SolidRepository} from "@infr/solid";
// import {LocalRepository} from "@infr/local/local.repository";
import {MeldRepository} from "@infr/m-ld/meld.repository";

export const InfrContainer = Container.withProviders(
    // YjsConnector,
    // SolidRepository,
    MeldRepository,
    // LocalRepository
)
