import {Container} from "@cmmn/core";
import {DomainModel} from "@domain/model/index";

export const DomainContainer = () => Container.withProviders(
    DomainModel
)
