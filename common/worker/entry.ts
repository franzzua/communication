import {Action, IFactory, WorkerMessage} from "@common/domain";
import {cell} from "@common/core";
import {cellx} from "cellx";

export class Entry {

    constructor(private factory: IFactory) {
        cellx(() => this.response).subscribe(response => self.postMessage(response));
        cellx(() => this.state).subscribe(state => self.postMessage(state));
    }

    $messages = this.$getMessageCell();

    get action(): Action {
        const lastMessage = this.$messages.get();
        if (lastMessage.data.type !== 'action')
            return null;
        return lastMessage.data.action;
    }

    get state(): any {
        const lastMessage = this.$messages.get();
        if (lastMessage.data.type !== 'state')
            return null;
        return lastMessage.data;
    }

    get response(): any {
        const action = this.action;
        const result = this.factory.GetModel(action.model, action.id).QueryModel(action.path).Actions[action.action](...action.args);
        return {type: 'response', response: result};
    }

    protected $getMessageCell() {
        return cell.fromEvent<MessageEvent<WorkerMessage>>(self, 'message');
    }
}


