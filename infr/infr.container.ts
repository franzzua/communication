import {Container} from "@cmmn/core";
import {YjsRepository} from "@infr/yjs/yjsRepository";

export const InfrContainer = Container.withProviders(
    YjsRepository
)
