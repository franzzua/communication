import {AccountManager} from "./account.manager";
import {StorageService} from "./storage.service";
import {combineLatest, Injectable, map} from "@hypertype/core";
import {StateService} from "./state.service";

@Injectable()
export class ManagementService{

    constructor(private accountManager: AccountManager,
                private stateService: StateService,
                private storageService: StorageService) {
    }

    private Accounts$ = combineLatest([
        this.accountManager.Providers$,
        this.accountManager.Accounts$
    ]).pipe(
        map(([providers, accounts]) => {
            return {
                Messages: providers.map(x => ({
                    id: `provider.${x}`,
                    Content: x,
                    Action: `accounts.${x}.add`,
                    SubContext: {
                        id: 'Management.Accounts',
                        Messages: accounts
                            .filter(a => a.type == x)
                            .map(a => ({
                                id: a.title,
                                Content: a.title
                            }))
                    }
                }))
            }
        })
    );

    private Storages$ = this.storageService.Storages$.pipe(

    )

    public State$ = combineLatest([
        this.Accounts$, this.Storages$, this.stateService.State$
    ]).pipe(
        map(([accounts, storages, state]) => ({
            id: 'Root',
            Messages: [{
                id: 'Management',
                Content: 'Management',
                Action: '',
                SubContext: {
                    id: 'Management',
                    Messages: [
                        {
                            id: 'Management.Accounts',
                            Content: 'Accounts',
                            Action: '',
                            SubContext: accounts
                        },
                        {
                            id: 'Management.Storages',
                            Content: 'Storages',
                            Action: '',
                            SubContext: {
                                id: 'Management.Storages',
                                Messages: storages.map(s => ({
                                    id: `storage.${s.URI}`,
                                    Content: s.URI,
                                    Action: 'message.add',
                                    // SubContext: state.Root
                                }))
                            }
                        },
                        {
                            id: 'Management.Settings',
                            Action: '',
                            Content: 'Settings'
                        }
                    ]
                }
            }]
        }))
    )
}
