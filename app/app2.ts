import {Application, Builder} from "@common/app";
import {useStreamDomain, useWorkerDomain} from "@common/domain";
import {Routes} from "./routes";
import {Container, Injectable} from "@common/core";
import {AppRootComponent} from "./app-root.component";
import {TextContentComponent} from "../ui/content/text-content.component";
import {RouterService} from "./services/router.service";
import {TreeComponent} from "../ui/tree/tree.component";
import {AccountManager, DomainProxy} from "@services";
import {TreeReducers} from "../ui/tree/tree-reducers";
import {TreePresenter} from "../presentors/tree.presentor";
import {MobileToolbarComponent} from "../ui/mobile-toolbar/mobile-toolbar.component";
import {Factory} from "@domain/model/factory";
import {DomainContainer} from "@domain";
import {InfrContainer} from "@infr/infr.container";
import {AppInitComponent} from "./init/app-init.component";

@Injectable()
export class App2 extends Application {

    constructor(container: Container) {
        super(container);
    }

    public static async Build() {
        return new Builder()
            .with(InfrContainer)
            .with(DomainContainer)
            .with(useStreamDomain(Factory))
            .with(Container.withProviders(
                RouterService,  TreeReducers, TreePresenter, DomainProxy, AccountManager
            ))
            .withUI(AppRootComponent, TextContentComponent, TreeComponent, MobileToolbarComponent, AppInitComponent)
            .withRoutes({
                options: null,
                routes: Routes
            })
            .build(App2);
    }

}
