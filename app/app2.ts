import {Application, Builder} from "@cmmn/app";
import {Locator, useStreamDomain} from "@cmmn/domain/proxy";
import {Locator as WorkerLocator} from "@cmmn/domain/worker";
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
import {DomainContainer} from "@domain";
import {InfrContainer} from "@infr/infr.container";
import {AppInitComponent} from "./init/app-init.component";
import {DomainLocator} from "@domain/model/domain-locator.service";
import { UIContainer } from "../ui/container";
import {WrapperComponent} from "./pages/wrapper/wrapper.component";

@Injectable()
export class App2 extends Application {

    constructor(container: Container) {
        super(container);
    }

    public static async Build() {
        return new Builder()
            .with(InfrContainer())
            .with(DomainContainer())
            .with(useStreamDomain())
            .with(Container.withProviders(
                {provide: Locator, useFactory: cont => cont.get(DomainLocator)},
                DomainLocator,
                RouterService, TreeReducers, TreePresenter, DomainProxy, AccountManager
            ))
            .withUI([AppRootComponent, AppInitComponent, WrapperComponent])
            .withUI(UIContainer)
            .withRoutes({
                options: null,
                routes: Routes
            })
            .build(App2);
    }

}
