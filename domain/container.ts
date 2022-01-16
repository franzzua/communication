import {Container} from "@cmmn/core";
import {DomainModel} from "@domain/model";
import {Factory} from "./model/factory";

export const DomainContainer = Container.withProviders(
    DomainModel, Factory
)
