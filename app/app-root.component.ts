import {Component, HyperComponent} from "@hypertype/ui";
import {Router, RouterState} from "@hypertype/app";
import {Routes} from "./routes";
import {combineLatest, map, delay, Injectable} from "@hypertype/core";
import {PanelService} from "./services/panel.service";

@Injectable()
@Component({
    name: 'app-root',
    template(html, state: State) {
        const route = Routes.find(route => route.name == state.Router.name);
        return html`
    <aside class="top" empty=${!state.Panels.Top}>
        ${state.Panels.Top ?? ''}
    </aside>
    ${route?.template(html('route'), state.Router.params) ?? html`unknown route ${state.Router.name}`}
    <ctx-management></ctx-management>
    <aside class="bottom" empty=${!state.Panels.Bottom}>
        ${state.Panels.Bottom ?? ''}
    </aside>
        `;
    },
    style: require('./styles/root.style.less')
})
export class AppRootComponent extends HyperComponent<State> {
    constructor(private router: Router,
                private panelService: PanelService) {
        super();
    }

    public State$ = combineLatest([
        this.router.State$,
        this.panelService.Panels$
    ]).pipe(
        delay(0),
        map(([router, panels]) => ({
            Router: router,
            Panels: panels
        }))
    );
}

type State = {
    Router: RouterState,
    Panels: any
}