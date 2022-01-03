import {BehaviorSubject, Injectable, Observable} from "@hypertype/core";
import {ActionService} from "./action.service";
import {EventBus} from "./event.bus";

@Injectable()
export class AccountManager {

    constructor() {

    }

    private accountsSubject$ = new BehaviorSubject<IAccountInfo[]>([]);
    public Accounts$: Observable<IAccountInfo[]> = this.accountsSubject$.asObservable();
    private providerSubject$ = new BehaviorSubject<string[]>([]);
    public Providers$: Observable<string[]> = this.providerSubject$.asObservable();

    private providers = new Map<string, IAccountProvider>();

    public async Register(provider: IAccountProvider) {
        this.providers.set(provider.type, provider);
        provider.Check().then(res => res && this.addAccount(res));
        this.providerSubject$.next([...this.providerSubject$.value, provider.type]);
    }

    private async addAccount(info: IAccountInfo){
        this.accountsSubject$.next([...this.accountsSubject$.value, info]);
    }

    Login(provider: "google") {
        this.providers.get(provider)?.Login();
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
