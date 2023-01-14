import {Application, Builder} from "@cmmn/app";
import {Container, Injectable} from "@cmmn/core";
import {TreeReducers} from "../../../ui/tree/tree-reducers";
import {TreePresenter} from "../../../presentors/tree.presentor";
import { UIContainer } from "../../../ui/container";
import {DomainProxyMock} from "../mocks/domain-proxy.mock";
import { DomainProxy } from "@proxy";

@Injectable()
export class TestApp extends Application {

    constructor(public cont: Container) {
        super(cont);
    }

    public static async Build() {
        return new Builder()
            .with(Container.withProviders(
                TreeReducers, TreePresenter, {
                    provide: DomainProxy, useClass: DomainProxyMock
                }
            ))
            .withUI(UIContainer)
            .build(TestApp);
    }

}
