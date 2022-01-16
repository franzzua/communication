import {Router} from "@cmmn/app";
import {Injectable} from "@cmmn/core";

@Injectable()
export class RouterService {

    constructor(private router: Router) {
    }


    goToContext(contextURI: string) {
        const uri = encodeURIComponent(btoa(contextURI).replaceAll('=', ''));
        this.router.Route = {
            name: 'context',
            params: {uri}
        };
    }

    public get ContextURI() {
        if (this.router.RouteName !== 'context')
            return null;
        const uriBase64 = this.router.Query.uri;
        return atob(decodeURIComponent(uriBase64));
    }
}