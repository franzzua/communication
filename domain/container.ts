import {Container} from "@hypertype/core";
import {ContextModel, DomainModel, MessageModel} from "@domain/model";
import {LocalStorageModel} from "./model/local-storage.model";
import {Factory} from "./model/factory";
import {IFactory} from "./model/i-factory";

export const DomainContainer = Container.withProviders(
    DomainModel,
    ContextModel,
    MessageModel,
    {provide: IFactory, useClass: Factory},
    LocalStorageModel
)
