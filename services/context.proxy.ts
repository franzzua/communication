// import {Context, Message} from "@model";
// import {ProxyProvider} from "./proxy-provider.service";
// import {Fn} from "@common/core";
// import {IFactory} from "@common/domain";
// import {IContextActions, IMessageActions} from "@domain";
//
// export class MessageProxy {
//     private model = this.factory.GetModel<Message, IMessageActions>('message', this.id);
//     constructor(private factory: IFactory, private id: any) {
//
//     }
//
//     get State(): Message{
//         return this.model.State;
//     }
//
//
//     get Context(): ContextProxy{
//         return this.model.State;
//     }
//
// }
//
// export class ContextProxy {
//     private model = this.factory.GetModel<Context, IContextActions>('context', this.uri);
//
//     constructor(private factory: IFactory, private uri) {
//     }
//
//     get Messages(): ReadonlyArray<MessageProxy>{
//         const state = this.model.State as Context;
//         if (!state) return [];
//         return state.Messages.map(x => new MessageProxy(this.factory, x.id))
//     }
//
//     @Fn.distinctUntilChanged(Context.equals)
//     get State(): Context {
//         return this.model.State;
//     }
//
//     public Actions = this.model.Actions;
//
// }
