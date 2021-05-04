import {Container} from "@hypertype/core";
import {ContextModel, DomainModel, MessageModel} from "@domain/model";
import {LocalStorageModel} from "./model/local-storage.model";
import {Factory} from "./model/factory";
import {IFactory} from "./model/i-factory";
import {DomainProxy, StorageProxy} from "@domain/proxies/domain.proxy";
import {Model, ModelStream} from "@hypertype/domain";
import {SolidStorageModel} from "@domain/model/solid-storage-model.service";

export const DomainContainer = Container.withProviders(
    DomainModel,
    ContextModel,
    MessageModel,
    {provide: IFactory, useClass: Factory},
    LocalStorageModel, SolidStorageModel,

    {provide: DomainProxy, deps: [ModelStream]},
    {provide: Model, useClass: DomainModel}
)
