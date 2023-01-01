import {ModelMap, ModelProxy, proxy} from "@cmmn/domain/proxy";
import {Context, Message} from "@model";
import {IContextActions} from "@domain";
import {MessageProxy} from "./message-proxy";

@proxy.of(Context, (uri, self) => ['Contexts', uri])
export class ContextProxy extends ModelProxy<Context, IContextActions> {

    get Messages(): ReadonlyArray<MessageProxy> {
        return this.State.Messages.map(x => this.MessageMap.get(x)).filter(x => x.State);
    }

    get Parents(): ReadonlyArray<MessageProxy> {
        return [...this.ParentsMap.values()].orderBy(x => x.State.id);
    }

    @proxy.map<Context>(Message, c => c.Messages)
    MessageMap: ModelMap<MessageProxy>;

    @proxy.map<Context>(Message, c => c.Parents)
    ParentsMap: ModelMap<MessageProxy>;

    public CreateMessage(message: Message): MessageProxy {
        this.Actions.CreateMessage(message);
        this.State.Messages.push(message.id);
        const result = this.MessageMap.get(message.id);
        result.State = message;
        return result;
    }
}
