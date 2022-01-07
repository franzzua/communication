import {Injectable} from "@common/core";
import {Context, DomainState, Message} from "@model";
import type {Model} from "@common/domain";
import {IFactory} from "@common/domain";
import type {IContextActions, IDomainActions, IMessageActions} from "@domain";
import {ContextProxy} from "./context.proxy";

@Injectable()
export class ProxyProvider {
    constructor(private factory: IFactory<Model<DomainState, IDomainActions>>) {
    }

    public GetContextProxy(uri: string): ContextProxy {
        return this.GetOrCreate(uri);
    }

    private Instances = new Map<string, ContextProxy>();

    public GetOrCreate(uri: string) {
        return this.Instances.getOrAdd(uri, uri => new ContextProxy(this, uri))
    }

    public GetModel(uri: string) {
        return this.factory.GetModel<Model<Context, IContextActions>>('Context', uri);
    }

    public GetMessageProxy(message: Message): Model<Message, IMessageActions> {
        // await this.domainProxy.State$.pipe(
        //     map(x => x.Contexts.get(message.Context.URI).Messages.get(message.id)),
        //     filter(x => x != null),
        //     first()
        // ).toPromise()
        return this.factory.GetModel<Model<Context, IContextActions>>('Context', message.Context.URI).QueryModel(['Messages', message.id]);
    }
}


