import { Fn } from "@cmmn/core";
import {IAccountInfo, IAccountProvider} from "@infr/account.manager";

export class FakeLoginService implements IAccountProvider{
    type: string = 'fake';

    async Check(): Promise<IAccountInfo> {
        const str = localStorage["account"];
        return str && JSON.parse(str) as IAccountInfo;
    }

    async Login(): Promise<IAccountInfo> {
        const name = prompt('Tell me your name, pls');
        const acc = {
            type: 'fake',
            id: Fn.ulid(),
            title: name,
            session: {},
            defaultStorage: `fake://${name}/`
        } as IAccountInfo;
        localStorage.setItem('account', JSON.stringify(acc));
        return acc;
    }
    async Logout(){
        localStorage.removeItem('account');
    }

}