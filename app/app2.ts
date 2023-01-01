import {Application, Builder} from "@cmmn/app";
import {Locator, useStreamDomain, useWorkerDomain} from "@cmmn/domain/proxy";
import {Routes} from "./routes";
import {Container, Injectable} from "@cmmn/core";
import {AppRootComponent} from "./app-root.component";
import {TextContentComponent} from "../ui/content/text-content.component";
import {RouterService} from "./services/router.service";
import {TreeComponent} from "../ui/tree/tree.component";
import {AccountManager, DomainProxy} from "@services";
import {TreeReducers} from "../ui/tree/tree-reducers";
import {TreePresenter} from "../presentors/tree.presentor";
import {MobileToolbarComponent} from "../ui/mobile-toolbar/mobile-toolbar.component";
import {AppInitComponent} from "./init/app-init.component";
import {DomainContainer} from "@domain";

@Injectable()
export class App2 extends Application {

    constructor(container: Container) {
        super(container);
    }

    public static async Build() {
        return new Builder()
            .with(useStreamDomain())
            .with(DomainContainer)
            .with(Container.withProviders(
                RouterService,  TreeReducers, TreePresenter, DomainProxy, AccountManager,
            ))
            .withUI([
                AppRootComponent, TextContentComponent, TreeComponent, MobileToolbarComponent, AppInitComponent
            ])
            .withRoutes({
                options: null,
                routes: Routes
            })
            .build(App2);
    }

}
