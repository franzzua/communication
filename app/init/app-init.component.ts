import {Injectable, bind} from "@cmmn/core";
import {AccountManager, IAccountInfo} from "@services";
import {AppInitTemplate, IEvents} from "./app-init.template";
import {RouterService} from "../services/router.service";
import {component, HtmlComponent} from "@cmmn/ui";
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

    public $state = this.accManager.$accounts;

    public Actions = [
        this.init
    ]

    @bind
    private async init() {
        const accounts = this.accManager.$accounts.get();
        if (!accounts.length) {
            return;
        }
        const contextURI = `${accounts[0].defaultStorage}/root`;
        this.routerService.goToContext(contextURI);
    }

    public Events = {
        login: async (provider: 'google') => {
            await this.accManager.Login(provider);
            await this.init();
        }
    }
}

