import {Fn, Injectable} from "@cmmn/core";
import {AccountManager} from "@infr/account.manager";

@Injectable()
export class Api {
    constructor(private accManager: AccountManager) {
    }

    private headers: Promise<object> | object = {};

    public withHeaders(headers: Promise<object> | object): this {
        const that = Object.create(this);
        that.headers = Promise.all([this.headers, headers]).then(([h1, h2]) => ({
            ...h1, ...h2
        }));
        return that;
    }

    private id = Fn.ulid();

    public async GetUserInfo() {
        await this.accManager.init;
        const accs = this.accManager.$accounts.get();
        if (!accs.length){
            return undefined;
        }
        return accs[0];
    }

    public async fetch(input: string, init?: RequestInit): Promise<Response> {
        const user = await  this.GetUserInfo();
        return fetch(input, {
            ...init,
            headers: {
                'authorization': JSON.stringify({user: user?.id ?? 'unknown'}),
                ...init?.headers,
                ...(await this.headers)
            }
        });
    }
}

