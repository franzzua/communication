import {clone} from "@m-ld/m-ld";
// @ts-ignore
import type {MeldConfig, MeldRemotes} from "@m-ld/m-ld";
import {AblyRemotes} from "@m-ld/m-ld/dist/ably";
import leveljs from "level-js";


export class MeldFactory {

    private static GetRemote(config: MeldConfig){
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
        } as MeldConfig;
        localStorage.setItem('genesis', 'genesis');
        const backend = leveljs(uri);
        const remote = this.GetRemote(config) as MeldRemotes;
        // remote.live.subscribe(x => console.log('remote','live',x));
        const meld = await clone(backend, remote, config);
        // meld.status.subscribe(x => console.log('meld','status',x));
        // await meld.status.becomes({ online: true, outdated: false });
        return meld;
    }
}