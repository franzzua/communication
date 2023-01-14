import {Container} from "@cmmn/core";
import {DomainModel} from "@domain/model";

export const DomainContainer = () => Container.withProviders(
    DomainModel
)
