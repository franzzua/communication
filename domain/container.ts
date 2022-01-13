import {Container} from "@common/core";
import {DomainModel} from "@domain/model";
import {Factory} from "./model/factory";

export const DomainContainer = Container.withProviders(
    DomainModel, Factory
)
