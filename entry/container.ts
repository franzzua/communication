import {WorkerEntry} from "@common/domain/worker";
import {Container} from "@common/core";
import {DomainContainer} from "@domain";
import {InfrContainer} from "@infr/infr.container";

export const WorkerContainer = Container.withProviders(WorkerEntry);
WorkerContainer.provide(DomainContainer);
WorkerContainer.provide(InfrContainer);
