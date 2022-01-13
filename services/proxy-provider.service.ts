import {Injectable} from "@common/core";
import {IFactory, Model} from "@common/domain";
import {DomainState, Message} from "@model";
import {IDomainActions} from "@domain";
import {ContextProxy} from "./context-proxy";
import {MessageProxy} from "./message-proxy";
import {DomainProxy} from "./domain-proxy.service";

@Injectable()
export class ProxyProvider {
    constructor(private factory: IFactory<Model<DomainState, IDomainActions>>) {
    }

    public get Root(): DomainProxy {
        return this.factory.Root as DomainProxy;
    }

    public GetContext(uri: string): ContextProxy {
        return this.Root.ContextsMap.get(uri);
    }

    public GetMessage(message: Message): MessageProxy {
        // await this.domainProxy.State$.pipe(
        //     map(x => x.Contexts.get(message.Context.URI).Messages.get(message.id)),
        //     filter(x => x != null),
        //     first()
        // ).toPromise()
        return this.GetContext(message.ContextURI).MessageMap.get(message.id);
    }
}
