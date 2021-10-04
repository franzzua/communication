import {clone} from "@m-ld/m-ld";
// @ts-ignore
import type {MeldConfig, MeldRemotes, MeldClone} from "@m-ld/m-ld";
import {AblyRemotes} from "@m-ld/m-ld/dist/ably";
import * as leveljs from "level-js";
import { ulid } from "ulid";


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

    private static Cache = new Map<string, Promise<MeldClone>>();

    private static async CreateMeldClone(uri: string, id: string, genesis = false): Promise<MeldClone> {
        const config = {
            "@domain": `${btoa(uri).toLowerCase().replace(/=/g,'')}.context.app`,
            "@id": id,
            logLevel: "error",
            genesis
        } as MeldConfig;
        localStorage.setItem(uri, 'genesis');
        const backend = leveljs(uri);
        const remote = this.GetRemote(config);
        // remote.live.subscribe(x => console.log('remote','live',x));
        // @ts-ignore
        const meld = await clone(backend, remote, config);
        // meld.status.subscribe(x => console.log('meld','status',x));
        await meld.status.becomes({ online: true, outdated: false });
        return meld;
    }

    public static GetMeldClone(uri: string, id: string, genesis = false): Promise<MeldClone> {
        if (this.Cache.has(uri)) {
            return this.Cache.get(uri);
        }
        const clone = this.CreateMeldClone(uri, id, genesis);
        this.Cache.set(uri, clone);
        return clone;
    }
}