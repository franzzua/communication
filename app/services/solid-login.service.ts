import {Injectable} from "@hypertype/core";
import {ActionService} from "@services";
import {IAccountInfo, IAccountProvider} from "../../services/account.manager";
import {Profile, useFetch} from "solidocity";
import * as fetcher from "solid-auth-fetcher"
import * as inrupt from "@inrupt/solid-client-authn-browser";
// import decode from "jose/lib/jwt/decode";

const useInrupt = false;
const auth = useInrupt ? {
    session: null,
    login: idp => inrupt.login({
        oidcIssuer: idp,
        redirectUrl: window.location.href,
    }),
    getSession: async () => {
        const session = await inrupt.getDefaultSession();
        if (!session || !session.info.isLoggedIn)
            await session.handleIncomingRedirect(location.href);
        if (!session || !session.info.isLoggedIn)
            return null;
        useFetch(session.fetch);
        window['authFetch'] = session.fetch;
        return session
    }
}: {
    session: null,
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
        // @ts-ignore
        window.authFetch = session.fetch;
        console.log(session);
        return session;
        // const tokens: {
        //     accessToken;
        //     clientId;
        //     webId;
        //     refreshToken;
        //     redirectUri;
        //     issuer;
        //     idToken;
        //     clientSecret;
        //     codeVerifier;
        // } = JSON.parse(localStorage.getItem('solidAuthFetcherUser:global'));
        // const id: {
        //     exp; webid; iat; aud; iss; jti; kid; sub;
        // } = decode(tokens.idToken);
        // return {
        //     title: id.webid,
        //     type: 'solid',
        //     session
        // };
    }
}

@Injectable()
export class SolidLoginService implements IAccountProvider {

    constructor(private actionService: ActionService) {
        this.actionService.Register('solid.account.add', () => this.Login());
    }

    private async toAccountInfo(session): Promise<IAccountInfo> {
        if (!session ) return null;
        if (!session.info){
            const profile = new Profile(session.webId);
            await profile.Init();
            return {
                type: this.type,
                title: session.webId,
                session: session,
                defaultStorage: `${profile.Me.Storage}contexts`
            }
        }
        const profile = new Profile(session.info.webId);
        await profile.Init();
        return {
            type: this.type,
            title: session.info.webId,
            session: session.info,
            defaultStorage: `${profile.Me.Storage}/contexts`
        }
    }

   // private idp = 'https://broker.pod.inrupt.com';
    private idp = 'https://fransua.solidcommunity.net/';

    // private idp = 'https://solidweb.org/';
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

    public async Check(): Promise<IAccountInfo> {
        const session = await (auth.session || (auth.session = auth.getSession()));
        return await this.toAccountInfo(session);
    }

    public async CreateDefaultStorage(account: IAccountInfo) {

    }
}

