import {Injectable} from "@hypertype/core";
import {Context, DomainState, Message} from "@model";
import {IFactory} from "@common/domain";
import type {Model} from "@common/domain";
import type {IContextActions, IDomainActions, IMessageActions} from "@domain";

@Injectable()
export class ProxyProvider {
    constructor(private factory: IFactory<Model<DomainState, IDomainActions>>) {
    }

    public GetContextProxy(context: Context) {
        // await this.domainProxy.State$.pipe(
        //     map(x => x.Contexts.get(context.URI)),
        //     filter(x => x != null),
        //     first()
        // ).toPromise()
        return this.factory.GetModel<Model<Context, IContextActions>>('Context', context.URI);
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
