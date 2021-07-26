import {BehaviorSubject, Injectable, Observable} from "@hypertype/core";
import {ActionService} from "./action.service";
import {EventBus} from "./event.bus";

@Injectable()
export class AccountManager {

    constructor(private actionService: ActionService,
                private eventBus: EventBus) {

    }

    private accountsSubject$ = new BehaviorSubject<IAccountInfo[]>([]);
    public Accounts$: Observable<IAccountInfo[]> = this.accountsSubject$.asObservable();
    private providerSubject$ = new BehaviorSubject<string[]>([]);
    public Providers$: Observable<string[]> = this.providerSubject$.asObservable();

    public async Register(provider: IAccountProvider) {
        provider.Check().then(res => res && this.addAccount(res));
        this.actionService.Register(`accounts.${provider.type}.add`, async () => {
            const result = await provider.Login();
            if (result){
                await this.addAccount(result);
            }
        })
        this.providerSubject$.next([...this.providerSubject$.value, provider.type]);
    }

    private async addAccount(info: IAccountInfo){
        this.accountsSubject$.next([...this.accountsSubject$.value, info]);
        this.eventBus.Notify('OnNewAccount', info);
    }
}

export interface IAccountProvider {
    type: string;

    Check(): Promise<IAccountInfo>;

    Login(): Promise<IAccountInfo>;

}

export interface IAccountInfo {
    type: string;
    title: string;
    session: any;
    defaultStorage: string;
}
