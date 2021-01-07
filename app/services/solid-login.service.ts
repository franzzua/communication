import {Injectable} from "@hypertype/core";
import {ActionService} from "@services";
import * as solid from "solid-auth-client/browser";
import {IAccountInfo, IAccountProvider} from "../../services/account.manager";

@Injectable()
export class SolidLoginService implements IAccountProvider {

    constructor(private actionService: ActionService) {
        this.actionService.Register('solid.account.add', () => this.Login());
    }

    private toAccountInfo(session): IAccountInfo {
        if (!session) return null;
        return {
            type: this.type,
            title: session.webId,
            session
        }
    }

    public async Login(): Promise<IAccountInfo> {
        const session = await solid.login(`${location.origin}/pod/`);
        return this.toAccountInfo(session);
    }

    type: string = 'solid';

    public async Check(): Promise<IAccountInfo> {
        const session = await solid.currentSession();
        return this.toAccountInfo(session);
    }

    public async CreateDefaultStorage(account: IAccountInfo){

    }
}

export type Session = any;