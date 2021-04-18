import {Container} from "@hypertype/core";
import {AppContainer} from "../app-container";
import {ContextSync, YjsConnector} from "@infr/rtc/context.sync";
import {SolidRepository} from "@infr/solid";
import {SolidRepositoryMock} from "./mocks/solidRepositoryMock";
import {ConsoleLogFactory, Logger} from "@hypertype/infr/dist/index.js";
import {YjsConnectorMock} from "./mocks/yjs-repository.mock";
import {LocalRepository} from "@infr/local/local.repository";
import {LocalRepositoryMock} from "./mocks/local.repository.mock";

Logger.Factory = ConsoleLogFactory;

export function getTestContainer() {
    const container = Container.withProviders(
        ...AppContainer.getProviders().map(x => ({...x})),
        {provide: SolidRepository, useClass: SolidRepositoryMock},
        {provide: YjsConnector, useClass: YjsConnectorMock},
        {provide: LocalRepository, useClass: LocalRepositoryMock}
    );
    return container;
}

export function clearMocks() {
    YjsConnectorMock.Clear();
    SolidRepositoryMock.instances = [];
}

