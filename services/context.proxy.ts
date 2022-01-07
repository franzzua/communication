import {Context} from "@model";
import {ProxyProvider} from "./proxy-provider.service";
import {Fn} from "@common/core";

export class ContextProxy {
    private model = this.proxy.GetModel(this.uri);

    constructor(private proxy: ProxyProvider, private uri) {
    }

    @Fn.distinctUntilChanged(Context.equals)
    get State(): Context {
        const state = this.model.State as Context;
        if (!state) return state;
        const self = this;
        state.Messages = state.Messages.map(msg => ({
            ...msg,
            get Context(): Context {
                return state;
            },
            set Context(value: Context){
                msg.Context = value;
            },
            get SubContext(): Context {
                return msg.SubContext && self.proxy.GetOrCreate(msg.SubContext.URI).State;
            },
            set SubContext(value: Context){
                msg.SubContext = value;
            }
        }));
        return state;
    }

    public Actions = this.model.Actions;

}