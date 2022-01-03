import {IFactory} from "../shared/factory";
import {AsyncQueue, cell, deserialize, serialize} from "@common/core";
import {Injectable} from "@common/core";
import {ModelPath, WorkerAction, WorkerMessage, WorkerMessageType} from "../shared/types";

@Injectable()
export class WorkerEntry {

    constructor(private factory: IFactory) {
        self.postMessage({type: WorkerMessageType.Connected});
        this.$messages.subscribe((err, actions) => {
            const event = actions.data.value as MessageEvent<WorkerMessage>;
            switch (event.data.type) {
                case WorkerMessageType.Subscribe:
                    this.getModel(event.data).$state.subscribe((err, evt) => {
                        const state = evt.data.value;
                        this.postMessage({
                            ...(event.data as ModelPath),
                            type: WorkerMessageType.State,
                            state: serialize(state)
                        });
                    })
                    break;
                case WorkerMessageType.State:
                    this.getModel(event.data).$state(deserialize(event.data.state));
                    break;
                case WorkerMessageType.Action:
                    this.Action(event.data);
                    break;
            }
        })
    }

    private asyncQueue = new AsyncQueue();

    private Action(action: WorkerAction) {
        const result = this.asyncQueue.Invoke(() => this.getModel(action).Actions[action.action](...action.args.map(deserialize)));
        result.then(response => {
            return ({response: serialize(response)});
        })
            .catch(error => {
                return ({error: serialize(error)});
            })
            .then(responseOrError => {
                this.postMessage({
                    type: WorkerMessageType.Response,
                    actionId: action.actionId,
                    ...responseOrError
                });
            });
    }

    private postMessage(message: WorkerMessage) {
        self.postMessage(message);
    }

    private getModel(event: ModelPath) {
        return this.factory.GetModel(event.model, event.id).QueryModel(event.path);
    }

    $messages = cell.fromEvent<MessageEvent<WorkerMessage>>(self, 'message');

}


