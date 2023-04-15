import {WorkerEntry} from "@cmmn/domain/worker";
import {Container} from "@cmmn/core";
import {DomainContainer} from "@domain";
import {DomainLocator} from "@domain/model/domain-locator.service";
import {Locator} from "@cmmn/domain/worker";

export const WorkerContainer = Container.withProviders(WorkerEntry)
;
WorkerContainer.provide(DomainContainer());
WorkerContainer.provide([
    {provide: Locator, useFactory: cont => cont.get(DomainLocator)},
    DomainLocator,
]);
// WorkerContainer.provide(InfrContainer());
