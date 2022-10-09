import {Router} from "@cmmn/app";
import {Routes} from "./routes";
import {Injectable} from "@cmmn/core";
import {component, HtmlComponent} from "@cmmn/ui";
import style from "./styles/root.style.less";

@Injectable(true)
@component<State>({
    name: 'app-root',
    template(html, state) {
        const route = Routes.find(route => route.name == state.Router?.name);
        return html`
            ${route?.template(html('route'), state.Router?.params) ?? html('route')`unknown route ${state.Router?.name}`}
            <aside class="top" empty=${!state.Panels.Top}>
                ${state.Panels.Top ?? ''}
            </aside>
            <ctx-panel></ctx-panel>
            <aside class="bottom" empty=${!state.Panels.Bottom}>
                ${state.Panels.Bottom ?? ''}
            </aside>
        `;
    },
    style
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
