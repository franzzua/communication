import {Router} from "@common/app";
import {Routes} from "./routes";
import {Injectable} from "@common/core";
import {component, HtmlComponent} from "@common/ui";

@Injectable(true)
@component<State>({
    name: 'app-root',
    template(html, state) {
        const route = Routes.find(route => route.name == state.Router?.name);
        return html`
            <aside class="top" empty=${!state.Panels.Top}>
                ${state.Panels.Top ?? ''}
            </aside>
            ${route?.template(html('route'), state.Router?.params) ?? html('route')`unknown route ${state.Router?.name}`}
            <ctx-panel></ctx-panel>
            <aside class="bottom" empty=${!state.Panels.Bottom}>
                ${state.Panels.Bottom ?? ''}
            </aside>
        `;
    },
    style: require('./styles/root.style.less')
})
export class AppRootComponent extends HtmlComponent<State> {
    constructor(private router: Router) {
        super();
    }


    get State(): State {
        return {
            Router: this.router.Route,
            Panels: {
                Top: null,
                Bottom: null
            }
        }
    }
}

type State = {
    Router: {name; params;},
    Panels: any
}
