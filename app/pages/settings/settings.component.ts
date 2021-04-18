import {Component, HyperComponent} from "@hypertype/ui";
import {IEvents, IState, Template} from "./settings.template";
import {Injectable} from "@hypertype/core";
import * as h from "@hypertype/core";
import {AccountManager, ActionService} from "@services";

@Injectable(true)
@Component({
    name: 'ctx-settings',
    template: Template,
    style: require('./settings.style.less')
})
export class SettingsComponent extends HyperComponent<IState, IEvents>{

    constructor(private accountManger: AccountManager,
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
        }
    }
}
