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
        const config = {
            "@domain": "default.app",
            "@id": uri,
            logLevel: "trace",
            genesis: genesis ?? true
        } as MeldConfig;

        const backend = leveljs(uri);
        const remote = this.GetRemote(config) as MeldRemotes;
        remote.live.subscribe(console.log);
        try {
            const meld = await clone(backend, remote, config);
            meld.status.subscribe(console.info);
            return meld;
        }catch (e){
            console.warn(e);
            return clone(backend, remote, {
                ...config,
                genesis: !(genesis ?? true)
            });
        }
    }
}