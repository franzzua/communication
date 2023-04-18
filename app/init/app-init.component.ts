import {Injectable} from "@cmmn/core";
import {AppInitTemplate, IEvents} from "./app-init.template";
import {RouterService} from "../services/router.service";
import {component, effect, HtmlComponent} from "@cmmn/ui";
import {AccountManager, IAccountInfo} from "@infr/account.manager";
import style from './app-init.style.less';

@Injectable(true)
@component({
    name: 'app-init',
    template: AppInitTemplate,
    style
})
export class AppInitComponent extends HtmlComponent<IAccountInfo[], IEvents> {

    constructor(
        private accManager: AccountManager,
        private routerService: RouterService
    ) {
        super();
    }

    get State() {
        return this.accManager.$accounts.get();
    }

    @effect()
    protected async init() {
        const accounts = this.accManager.$accounts.get();
        if (!accounts.length) {
            return;
        }
        const contextURI = `${accounts[0].defaultStorage}/root`;
        this.routerService.goToContext(contextURI);
    }

    async login(provider: 'google') {
        await this.accManager.Login(provider);
        await this.init();
    }
}

