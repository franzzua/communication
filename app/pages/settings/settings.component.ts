import {Component, HyperComponent} from "@hypertype/ui";
import {IEvents, IState, Template} from "./settings.template";
import * as h from "@hypertype/core";
import {Injectable} from "@hypertype/core";
import {AccountManager, IAccountInfo} from "@services";

@Injectable(true)
@Component({
    name: 'ctx-settings',
    template: Template,
    style: require('./settings.style.less')
})
export class SettingsComponent extends HyperComponent<IState, IEvents> {

    constructor(private accountManger: AccountManager) {
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
        },
        clear: async (account: IAccountInfo) => {
            throw new Error('not implemented');
            // for (let storage of state.Storages) {
            //     const proxy = this.domainProxy.GetStorageProxy(storage.URI);
            //     await proxy.Actions.Clear();
            // }
        }
    }
}
