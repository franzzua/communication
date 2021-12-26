import {Injectable} from "@hypertype/core";
import {Context, Message} from "@model";
import {IFactory, Model} from "@common/domain";
import {DomainModel} from "@domain/model";
import {IContextActions, IMessageActions} from "@domain";

@Injectable()
export class ProxyProvider {
    constructor(private factory: IFactory<DomainModel>) {
    }

    public async GetContextProxy(context: Context) {
        // await this.domainProxy.State$.pipe(
        //     map(x => x.Contexts.get(context.URI)),
        //     filter(x => x != null),
        //     first()
        // ).toPromise()
        return this.factory.GetModel<Model<Context, IContextActions>>('Context', context.URI);
    }

    public async GetMessageProxy(message: Message) {
        // await this.domainProxy.State$.pipe(
        //     map(x => x.Contexts.get(message.Context.URI).Messages.get(message.id)),
        //     filter(x => x != null),
        //     first()
        // ).toPromise()
        return this.factory.GetModel<Model<Message, IMessageActions>>('Message', message.id);
    }
}
