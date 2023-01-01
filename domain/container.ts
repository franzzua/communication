import {Container} from "@cmmn/core";
import { Locator } from "@cmmn/domain/proxy";
import {DomainModel} from "@domain/model";
import {Factory} from "./model/factory";
import {InfrContainer} from "@infr/infr.container";

export const DomainContainer = Container.withProviders(
    DomainModel,
    {provide: Locator, useClass: Factory}
);
DomainContainer.provide(InfrContainer);
