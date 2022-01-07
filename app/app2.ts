import {Builder} from "@common/app";
import {useWorkerDomain} from "@common/domain";
import {Routes} from "./routes";
import {Container, Injectable} from "@common/core";
import { Application } from "@common/app";
import {AppRootComponent} from "./app-root.component";
import {TextContentComponent} from "../ui/content/text-content.component";
import {RouterService} from "./services/router.service";
import {TreeComponent} from "../ui/tree/tree.component";
import {ProxyProvider, StateService} from "@services";
import {TreeReducers} from "../ui/tree/tree-reducers";
import {TreePresenter} from "../presentors/tree.presentor";

@Injectable()
export class App2 extends Application{

    constructor(container: Container) {
        super(container);
    }

    public static Build() {
        return new Builder()
            .with(useWorkerDomain('./worker.js'))
            .with(Container.withProviders(
                RouterService, StateService, ProxyProvider, TreeReducers, TreePresenter
            ))
            .withUI(AppRootComponent, TextContentComponent, TreeComponent)
            .withRoutes({
                options: null,
                routes: Routes
            })
            .build(App2);
    }

}