import {Application, Builder} from "@common/app";
import {useWorkerDomain} from "@common/domain";
import {Routes} from "./routes";
import {Container, Injectable} from "@common/core";
import {AppRootComponent} from "./app-root.component";
import {TextContentComponent} from "../ui/content/text-content.component";
import {RouterService} from "./services/router.service";
import {TreeComponent} from "../ui/tree/tree.component";
import {ProxyProvider} from "@services";
import {TreeReducers} from "../ui/tree/tree-reducers";
import {TreePresenter} from "../presentors/tree.presentor";
import {MobileToolbarComponent} from "../ui/mobile-toolbar/mobile-toolbar.component";
import {DomainProxy} from "@services";

@Injectable()
export class App2 extends Application {

    constructor(container: Container) {
        super(container);
    }

    public static async Build() {
        const workerDomain = await useWorkerDomain('./worker.js');
        return new Builder()
            .with(workerDomain)
            .with(Container.withProviders(
                RouterService, ProxyProvider, TreeReducers, TreePresenter, DomainProxy
            ))
            .withUI(AppRootComponent, TextContentComponent, TreeComponent, MobileToolbarComponent)
            .withRoutes({
                options: null,
                routes: Routes
            })
            .build(App2);
    }

}
