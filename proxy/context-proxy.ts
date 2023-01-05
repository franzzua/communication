import {ModelKey, ModelMap, ModelProxy, proxy} from "@cmmn/domain/proxy";
import {Context, Message} from "@model";
import {IContextActions} from "@domain";
import {MessageProxy} from "./message-proxy";

@proxy.of(Context, (uri, self) => ['Contexts', uri])
export class ContextProxy extends ModelProxy<Context, IContextActions> {

    get Messages(): ReadonlyArray<MessageProxy> {
        return this.State?.Messages.map(x => this.MessageMap.get(x)).filter(x => x.State) ?? [];
    }

    get Parents(): ReadonlyArray<MessageProxy> {
        return [...this.ParentsMap.values()].orderBy(x => x.State.id);
    }

    @proxy.map<Context>(Message, c => c.Messages)
    MessageMap: Map<ModelKey, MessageProxy>;

    @proxy.map<Context>(Message, c => c.Parents)
    ParentsMap: Map<ModelKey, MessageProxy>;

    public CreateMessage(message: Message, index = this.Messages.length): MessageProxy {
        this.Actions.CreateMessage(message, index);
        this.State = {
            ...this.State,
            Messages: [
                ...this.State.Messages.slice(0, index),
                message.id,
                ...this.State.Messages.slice(index)
            ]
        };
        const result = this.MessageMap.get(message.id);
        result.State = message;
        console.log('add', this.Messages);
        return result;
    }
}
