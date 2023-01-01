import {ModelProxy, proxy} from "@cmmn/domain/proxy";
import {Context, Message} from "@model";
import {IContextActions} from "@domain";
import {MessageProxy} from "./message-proxy";
import {ModelMap} from "@cmmn/domain/proxy";

@proxy.of(Context, (uri, self) => ['Root', 'Contexts', uri])
export class ContextProxy extends ModelProxy<Context, IContextActions> {
    get Messages(): ReadonlyArray<MessageProxy> {
        const permutation = this.State.Permutation;
        const messages = [...this.MessageMap.values()].orderBy(x => x.State?.id);
        if (!permutation)
            return messages;
        return permutation.Invoke(messages).filter(x => x != null);
    }

    // get Parents(): ReadonlyArray<MessageProxy> {
    //     return [...this.ParentsMap.values()].orderBy(x => x.State.id);
    // }

    @proxy.map<Context>(Message, c => c.Messages)
    MessageMap: ModelMap<MessageProxy>;

    // @proxy.map<Context>(Message, c => c.Parents)
    // ParentsMap: ModelMap<MessageProxy>;
}
