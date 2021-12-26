import {Container} from "@hypertype/core";
import {ContextModel, DomainModel, MessageModel} from "@domain/model";
import {Factory} from "./model/factory";
import {IFactory} from "@common/domain";
import {DomainProxy} from "@domain/proxies/domain.proxy";
import {Model, ModelStream} from "@hypertype/domain";

export const DomainContainer = Container.withProviders(
    DomainModel,
    ContextModel,
    MessageModel,
    {provide: IFactory, useClass: Factory},

    // {provide: DomainProxy, deps: [ModelStream]},
    // {provide: Model, useClass: DomainModel}
)
