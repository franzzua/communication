import {Container} from "@hypertype/core";
import {DomainContainer} from "../domain.container";
import {ContextSync, YjsConnector} from "@infr/rtc/context.sync";
import {SolidRepository} from "@infr/solid";
import {SolidRepositoryMock} from "./mocks/solidRepositoryMock";
import {ConsoleLogFactory, Logger} from "@hypertype/infr/dist/index.js";
import {YjsConnectorMock} from "./mocks/yjs-repository.mock";

Logger.Factory = ConsoleLogFactory;

export function getTestContainer() {
    const container = Container.withProviders(
        ...DomainContainer.getProviders().map(x => ({...x})),
        {provide: SolidRepository, useClass: SolidRepositoryMock},
        {provide: YjsConnector, useClass: YjsConnectorMock}
    );
    return container;
}

export function clearMocks() {
    YjsConnectorMock.Clear();
    SolidRepositoryMock.instances = [];
}

