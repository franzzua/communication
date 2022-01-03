import {Container} from "@common/core";
import {YjsRepository} from "@infr/y/yjsRepository";

export const InfrContainer = Container.withProviders(
    YjsRepository
    // SolidRepository,
    // MeldRepository,
    // LocalRepository
)
