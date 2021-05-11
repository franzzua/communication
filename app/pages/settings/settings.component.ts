import {Component, HyperComponent} from "@hypertype/ui";
import {IEvents, IState, Template} from "./settings.template";
import {first, Injectable} from "@hypertype/core";
import * as h from "@hypertype/core";
import {AccountManager, ActionService, IAccountInfo} from "@services";
import {DomainProxy} from "@domain";

@Injectable(true)
@Component({
    name: 'ctx-settings',
    template: Template,
    style: require('./settings.style.less')
})
export class SettingsComponent extends HyperComponent<IState, IEvents>{

    constructor(private accountManger: AccountManager,
                private domainProxy: DomainProxy,
                private actionsService: ActionService) {
        super();
    }

    public State$ = h.combineLatest([
        this.accountManger.Accounts$,
        this.accountManger.Providers$
    ]).pipe(
        h.map(([accounts, providers]) => ({
            accounts, providers
        }))
    );

    public Events = {
        addAccount: async (provider) => {
            this.actionsService.Invoke(`accounts.${provider}.add`);
        },
        clear: async (account: IAccountInfo) => {
            const state = await this.domainProxy.State$.pipe(first()).toPromise();
            for (let storage of state.Storages) {
                const proxy = this.domainProxy.GetStorageProxy(storage.URI);
                await proxy.Actions.Clear();
            }
        }
    }
}
