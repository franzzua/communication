import {Injectable} from "@cmmn/core";

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

    public async fetch(input: string, init?: RequestInit): Promise<Response> {
        return fetch(input, {
            ...init,
            headers: {
                ...init?.headers,
                ...(await this.headers)
            }
        });
    }
}

