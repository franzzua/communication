import {Container} from "@common/core";
import {YjsRepository} from "@infr/yjs/yjsRepository";

export const InfrContainer = Container.withProviders(
    YjsRepository
)
