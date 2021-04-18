import {Injectable} from "@hypertype/core";
import {ActionService} from "@services";
import {IAccountInfo, IAccountProvider} from "../../services/account.manager";
import {Profile, useFetch} from "solidocity";
import {login, handleIncomingRedirect, getDefaultSession, onSessionRestore, Session} from "@inrupt/solid-client-authn-browser";
import decode from "jose/lib/jwt/decode";

onSessionRestore(console.log);


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

   private idp = 'https://broker.pod.inrupt.com';

    // private session: Session;

    public async Login(): Promise<IAccountInfo> {
        await login({
            oidcIssuer: this.idp,
            redirectUrl: window.location.href,
           // clientId: '1a86fd20-6234-419a-8c45-31b9268c4150'
        });
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
        try{
           // await handleRedirect(window.location.href);
            const session = new Session({}, localStorage.sessionId ?? undefined);
            const result = await session.handleIncomingRedirect({
                restorePreviousSession: true,
                url: window.location.href,
            });
            console.log(result);
            if (session?.info?.isLoggedIn){
                localStorage.sessionId = session.info.sessionId;
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
                useFetch(session.fetch);
                // console.log(id);
                // if (id.exp * 1000 < +new Date()){
                //     debugger;
                //     return null;
                // }
                return {
                    title: session.info.webId,
                    type: this.type,
                    session: {
                        webId: session.info.webId
                    }
                };
            }
            return null;
        }catch (e){
            console.error(e);
        }
    }

    public async CreateDefaultStorage(account: IAccountInfo) {

    }
}

