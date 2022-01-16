import {IFactory} from "../shared/factory";
import {AsyncQueue, cell, deserialize, Injectable, serialize} from "@cmmn/core";
import {ModelPath, WorkerAction, WorkerMessage, WorkerMessageType} from "../shared/types";

@Injectable()
export class WorkerEntry {

    constructor(private factory: IFactory) {
        this.postMessage({
            type: WorkerMessageType.Connected,
        });
        this.$messages.subscribe((err, actions) => {
            const event = actions.data.value as MessageEvent<WorkerMessage>;
            switch (event.data.type) {
                case WorkerMessageType.Subscribe:
                    const path = event.data.path;
                    const model = this.getModel(path);
                    if (!model)
                        throw new Error(`Model not found at path ${path.join(':')}`)
                    model.$state.subscribe((err, evt) => {
                        const state = evt.data.value;
                        this.postMessage({
                            path,
                            type: WorkerMessageType.State,
                            state: serialize(state)
                        });
                    });
                    const state = model.State;
                    this.postMessage({
                        path,
                        type: WorkerMessageType.State,
                        state: serialize(state)
                    });
                    break;
                case WorkerMessageType.State:
                    this.getModel(event.data.path).$state(deserialize(event.data.state));
                    break;
                case WorkerMessageType.Action:
                    this.Action(event.data);
                    break;
            }
        })
    }

    private asyncQueue = new AsyncQueue();

    private Action(action: WorkerAction) {
        const result = this.asyncQueue.Invoke(() => {
            const model = this.getModel(action.path);
            return model.Actions[action.action](...action.args.map(deserialize));
        });
        result.then(response => {
            return ({response: serialize(response)});
        })
            .catch(error => {
                console.error(error);
                return ({error: serialize('domain error')});
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

    private getModel(path: ModelPath) {
        return this.factory.GetModel(path);
    }

    $messages = cell.fromEvent<MessageEvent<WorkerMessage>>(self, 'message');

}


