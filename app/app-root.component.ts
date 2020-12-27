import {Component, HyperComponent} from "@hypertype/ui";
import {RouterState, Router} from "@hypertype/app";
import {Routes} from "./routes";
import {delayAsync, Injectable, delay} from "@hypertype/core";

@Injectable()
@Component({
    name: 'app-root',
    template(html, state: RouterState) {
        const route = Routes.find(route => route.name == state.name);
        return route?.template(html, state.params) ?? html`unknown route ${state.name}`;
    },
    style: require('./root.style.less')
})
export class AppRootComponent extends HyperComponent<RouterState> {
    constructor(private router: Router) {
        super();
    }

    public State$ = this.router.State$.pipe(
        delay(0)
    );
}