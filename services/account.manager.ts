import {Injectable} from "@common/core";
import {Cell} from "cellx";
import {FakeLoginService} from "../app/services/fake-login.service";

@Injectable()
export class AccountManager {

    constructor() {
        this.Register(new FakeLoginService());
    }

    public $accounts = new Cell<IAccountInfo[]>([]);

    private providers = new Map<string, IAccountProvider>();

    public async Register(provider: IAccountProvider) {
        this.providers.set(provider.type, provider);
        provider.Check().then(res => res && this.addAccount(res));
    }

    private async addAccount(info: IAccountInfo){
        this.$accounts.set([
            ...this.$accounts.get(),
            info
        ]);
    }

    async Login(provider: "google") {
        const acc = await this.providers.get(provider)?.Login();
        this.addAccount(acc);
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
