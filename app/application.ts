import {ApplicationBuilder, RootStore, Store, } from "@hypertype/app";
import {container} from "../container";
import {UIContainer} from "../ui/container";
import {Routes} from "./routes";
import {AppRootComponent} from "./app-root.component";
import {YjsService} from "@infr/rtc";
import {ContextStore} from "../stores/context/context.store";

UIContainer.provide([
    AppRootComponent
]);

export const application = ApplicationBuilder
    .withConsoleLogging()
    .withRouter({
        options: null,
        routes: Routes
    })
    .withInfrustructure(container)
    .withUI(UIContainer)
    .withStores()
    .build();

application.get<RootStore>(RootStore).createStore();

const service = application.get<YjsService>(YjsService)
service.Actions$.subscribe();