import {Application as BaseApplication, ApplicationBuilder} from "@hypertype/app";
import {AppContainer} from "../app-container";
import {UIContainer} from "../ui/container";
import {Routes} from "./routes";
import {AppRootComponent} from "./app-root.component";
import {AccountManager} from "@services";
import {Container, Injectable, merge} from "@hypertype/core";
import {PanelService} from "./services/panel.service";
import {SettingsComponent} from "./pages/settings/settings.component";
import {PanelComponent} from "./panels/panel.component";
import {CrdtComponent} from "../crdt/ui/crdt/crdt.component";
import {ConcordComponent} from "../crdt/ui/concord/concord.component";
import {AppInitComponent} from "./init/app-init.component";
import {FakeLoginService} from "./services/fake-login.service";

UIContainer.provide([
    AppRootComponent,
    SettingsComponent,
    PanelComponent,
    CrdtComponent,
    ConcordComponent,
]);

@Injectable()
export class Application {
    constructor(
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
            .withInfrustructure(AppContainer)
            .withUI(UIContainer)
            .withUI(Container.withProviders(
                PanelService,
                // SolidLoginService,
                Application,
                AppInitComponent,
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
        await this.accountManager.Register(new FakeLoginService());
        // await this.accountManager.Register(this.base.get<SolidLoginService>(SolidLoginService));
    }

    private registerActions() {
    }

    public Actions$ = merge(
        // this.persistance.Actions$,
    );
}
