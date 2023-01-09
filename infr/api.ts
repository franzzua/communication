import {Fn, Injectable} from "@cmmn/core";
import {IAccountInfo} from "@services";

@Injectable()
export class Api {
    constructor() {
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

    public GetUserInfo() {
        let acc = JSON.parse(localStorage.getItem('account'));
        if (!acc){
            const name = prompt('Tell me your name, pls');
            const acc = {
                type: 'fake',
                title: name,
                session: {},
                defaultStorage: `fake://${name}/`,
                id: Fn.ulid()
            } as IAccountInfo;
            localStorage.setItem('account', JSON.stringify(acc));
        }
        return acc;
    }

    public async fetch(input: string, init?: RequestInit): Promise<Response> {
        return fetch(input, {
            ...init,
            headers: {
                'authorization': JSON.stringify({user: this.GetUserInfo()?.id ?? 'unknown'}),
                ...init?.headers,
                ...(await this.headers)
            }
        });
    }
}

