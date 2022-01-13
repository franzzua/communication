import {AccountManager} from "./account.manager";
import {StorageService} from "./storage.service";
import {combineLatest, Injectable, map, of} from "@hypertype/core";
import {StateService} from "./state.service";

@Injectable()
export class ManagementService{

    constructor(private accountManager: AccountManager,
                private stateService: StateService,
                private storageService: StorageService) {
    }

    private Storages$ = this.storageService.Storages$.pipe(

    )

    public State$ = combineLatest([
        of([]), this.Storages$
    ]).pipe(
        map(([accounts, storages]) => ({
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
