import {Injectable} from "@hypertype/core";
import {ActionService} from "@services";
import {IAccountInfo, IAccountProvider} from "../../services/account.manager";
import {Profile, useFetch} from "solidocity";
import * as fetcher from "solid-auth-fetcher"
import * as inrupt from "@inrupt/solid-client-authn-browser";
import decode from "jose/lib/jwt/decode";

const auth = {
    login: idp => fetcher.login({
        oidcIssuer: idp,
        redirect: window.location.href,
    }),
    getSession: async () => {
        await fetcher.handleRedirect(location.href);
        const session = await fetcher.getSession();
        if (!session || !session.loggedIn)
            return null;
        useFetch(session.fetch);
        console.log(session);
        return {
            title: session.webId,
            type: 'solid',
            session: session
        }
        const tokens: {
            accessToken;
            clientId;
            webId;
            refreshToken;
            redirectUri;
            issuer;
            idToken;
            clientSecret;
            codeVerifier;
        } = JSON.parse(localStorage.getItem('solidAuthFetcherUser:global'));
        const id: {
            exp; webid; iat; aud; iss; jti; kid; sub;
        } = decode(tokens.idToken);
        return {
            title: id.webid,
            type: 'solid',
            session: {
                webId: id.webid
            }
        };
    }
}

@Injectable()
export class SolidLoginService implements IAccountProvider {

    constructor(private actionService: ActionService) {
        this.actionService.Register('solid.account.add', () => this.Login());
    }

    private toAccountInfo(session): IAccountInfo {
        if (!session ) return null;
        return {
            type: this.type,
            title: session.webId,
            session
        }
    }

   // private idp = 'https://broker.pod.inrupt.com';
    private idp = 'https://solidcommunity.net/';
    // private session: Session;

    public async Login(): Promise<IAccountInfo> {
        await auth.login(this.idp);
        return null;
        // const session = new Session();
        // await session.login({
        //     // Specify the URL of the user's Solid Identity Provider; e.g., "https://inrupt.net"
        //     oidcIssuer: this.idp,
        //     // Specify the URL the Solid Identity Provider should redirect to after the user logs in,
        //     // e.g., the current page for a single-page app.
        //     redirectUrl: window.location.href,
        //     tokenType: 'Bearer'
        // })
        // return this.toAccountInfo(session.info);
    }

    type: string = 'solid';

    public Check(): Promise<IAccountInfo> {
        return auth.getSession();
    }

    public async CreateDefaultStorage(account: IAccountInfo) {

    }
}

