import {first, Injectable, mapTo, of, switchMap} from "@hypertype/core";
import {Component, HyperComponent} from "@hypertype/ui";
import {DomainProxy} from "@domain";
import {AccountManager, EventBus} from "@services";
import {AppInitTemplate} from "./app-init.template";
import { RouterService } from "../services/router.service";

@Injectable(true)
@Component({
    name: 'app-init',
    template: AppInitTemplate,
    style: require('./app-init.style.less')
})
export class AppInitComponent extends HyperComponent {

    constructor(
        private accManager: AccountManager,
        private eventBus: EventBus,
        private routerService: RouterService
    ) {
        super();
    }

    public State$ = this.accManager.Accounts$;

    public Actions$ = of(null).pipe(
        switchMap(() => this.init()),
        mapTo(null)
    );

    private async init() {
        const accounts = await this.accManager.Accounts$.pipe(first()).toPromise();
        if (!accounts.length) {
            return;
        }
        const contextURI = `${accounts[0].defaultStorage}/root`;
        this.routerService.toContext(contextURI);
    }

    public Events = {
        login: async (provider: 'google') => {
            await this.accManager.Login(provider);
            await this.init();
        }
    }
}

