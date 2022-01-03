import {Container} from "@common/core";
import {DomainModel} from "@domain/model";
import {Factory} from "./model/factory";
import {IFactory} from "@common/domain/worker";

export const DomainContainer = Container.withProviders(
    DomainModel,
    {provide: IFactory, useClass: Factory},
)
