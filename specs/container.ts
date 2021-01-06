import {Container} from "@hypertype/core";
import {DomainContainer} from "../domain.container";
import {YjsRepository} from "@infr/rtc/yjsRepository";
import {YjsRepositoryMock} from "./mocks/yjs-repository.mock";
import {SolidRepository} from "@infr/solid";
import {SolidRepositoryMock} from "./mocks/solidRepositoryMock";
import {ConsoleLogFactory, Logger} from "@hypertype/infr/dist/index.js";

Logger.Factory = ConsoleLogFactory;

export function getTestContainer() {
    const container = Container.withProviders(
        ...DomainContainer.getProviders().map(x => ({...x})),
        {provide: YjsRepository, useClass: YjsRepositoryMock},
        {provide: SolidRepository, useClass: SolidRepositoryMock},
    );
    return container;
}

export function clearMocks() {
    YjsRepositoryMock.Clear();
    SolidRepositoryMock.instances = [];
}

