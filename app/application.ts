import {Application as BaseApplication, ApplicationBuilder} from "@hypertype/app";
import {DomainContainer} from "../domain.container";
import {UIContainer} from "../ui/container";
import {Routes} from "./routes";
import {AppRootComponent} from "./app-root.component";
import {AccountManager, ActionService, StateService} from "@services";
import {Container, Injectable, merge} from "@hypertype/core";
import {PanelService} from "./services/panel.service";
import {SolidLoginService} from "./services/solid-login.service";
import {SolidStorageActions} from "./services/solid-storage-actions.service";
import {PersistanceService} from "@infr/persistance.service";

UIContainer.provide([
    AppRootComponent
]);

@Injectable()
export class Application {
    constructor(
        private stateService: StateService,
        private persistance: PersistanceService,
        private actionService: ActionService,
        private accountManager: AccountManager,
        private base: BaseApplication) {

    }

    public static Build() {
        const base = ApplicationBuilder
            .withConsoleLogging()
            .withRouter({
                options: null,
                routes: Routes
            })
            .withInfrustructure(DomainContainer)
            .withUI(UIContainer)
            .withUI(Container.withProviders(
                PanelService,
                SolidLoginService,
                SolidStorageActions,
                Application
            ))
            .build();
        return base.get<Application>(Application);
    }

    public async Init() {
        this.registerActions();
        await this.registerAccounts();
        this.base.Init();
    }

    private async registerAccounts() {
        await this.accountManager.Register(this.base.get<SolidLoginService>(SolidLoginService));
    }

    private registerActions() {
        this.base.get<SolidStorageActions>(SolidStorageActions).Actions.forEach(([key, action]) => {
            this.actionService.Register(key, action);
        });
    }

    public Actions$ =  merge(
        this.persistance.Actions$,
        this.stateService.Actions$
    );
}