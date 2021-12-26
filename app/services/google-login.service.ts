import {IAccountInfo, IAccountProvider} from "@services";

export class GoogleLoginService implements IAccountProvider{
    type: string = 'google';

    Check(): Promise<IAccountInfo> {
        return Promise.resolve(undefined);
    }

    Login(): Promise<IAccountInfo> {
        return Promise.resolve(undefined);
    }

}