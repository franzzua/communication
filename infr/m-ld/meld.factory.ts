const {clone} = require("@m-ld/m-ld/dist/index.js");
// @ts-ignore
//import type {MeldConfig, MeldRemotes} from "@m-ld/m-ld";
const {AblyRemotes} = require("@m-ld/m-ld/dist/ably");
import * as leveljs from "level-js";


export class MeldFactory {

    private static GetRemote(config: any){
        // @ts-ignore
        return new AblyRemotes({
            ...config,
            ably: {
                key: 'L-kF0A.fmJC2g:5jJoEJKmu7HbbQtO',
            }
        });
    }

    public static async GetMeldClone(uri: string, genesis: boolean | null = false) {
        genesis = !!localStorage.getItem('genesis');
        const config = {
            "@domain": "default.app",
            "@id": uri,
            logLevel: "error",
            genesis: genesis
        } as any;
        localStorage.setItem('genesis', 'genesis');
        const backend = leveljs(uri);
        const remote = this.GetRemote(config) as any;
        // remote.live.subscribe(x => console.log('remote','live',x));
        // @ts-ignore
        const meld = await clone(backend, remote, config);
        // meld.status.subscribe(x => console.log('meld','status',x));
        // await meld.status.becomes({ online: true, outdated: false });
        return meld;
    }
}