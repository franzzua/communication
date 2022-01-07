import {Injectable} from "@common/core";
import {Context, DomainState, Message} from "@model";
import type {Model} from "@common/domain";
import {IFactory} from "@common/domain";
import type {IContextActions, IDomainActions, IMessageActions} from "@domain";
import type {ContextModel, MessageModel} from "@domain/model";

@Injectable()
export class ProxyProvider {
    constructor(private factory: IFactory<Model<DomainState, IDomainActions>>) {
    }

    public GetContext(uri: string): ContextModel {
        return this.factory.GetModel<Context, IContextActions>(['Root', 'Contexts', uri]) as ContextModel;
    }

    public GetMessage(message: Message): MessageModel {
        // await this.domainProxy.State$.pipe(
        //     map(x => x.Contexts.get(message.Context.URI).Messages.get(message.id)),
        //     filter(x => x != null),
        //     first()
        // ).toPromise()
        return this.factory.GetModel<Message, IMessageActions>(['Root', 'Contexts', message.Context.URI, 'Messages', message.id]) as MessageModel;
    }
}


