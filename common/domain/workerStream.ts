import {cell} from "@common/core";
import {cellx} from "cellx";
import {ObservableMap} from "cellx-collections";
import {Action, Stream} from "./stream";
import {IAction} from "@hypertype/domain";

export class WorkerStream extends Stream {
    constructor(private workerUrl: string) {
        super();
    }

    private _worker: Worker;

    protected get Worker() {
        return this._worker ?? (this._worker = new Worker(this.workerUrl));
    }

    private messages = cell.fromEvent<MessageEvent>(this.Worker, "message");

    Requests = new ObservableMap<string, WorkerAction>(null);

    Models = cellx<Map<string, Map<any, any>>>(new Map(), {
        pull: (cell, next) => {
            const lastMessage = this.messages.get();
            if (lastMessage && lastMessage.data?.type == 'state'){
                const old = next.get(lastMessage.data.model) ?? new Map<any, any>();
                old.set(lastMessage.data.id, lastMessage.data.state);
                return next.with([lastMessage.data.model, old]);
            }
            return next;
        },
        put: (cell, value) => {

        }
    })


    async Invoke(action: Action) {
        this.postMessage({type: 'action', action});
    }

    getCell(model: string, id: any, path: string[] = []) {
        return cellx(() => {
            const map = this.Models();
            return map.get(`${model}`)?.get(`${id}`);
        }, {
            put: (cell, state) => {
                this.postMessage({
                    type: 'state',
                    model, id, path,
                    state
                })
            }
        })
    }

    private postMessage(msg: WorkerMessage){
        this.Worker.postMessage(msg);
    }

}


export type WorkerAction = {
    type: 'action';
    action: Action;
}
export type WorkerState = {
    type: 'state';
    model: string;
    id: number;
    path: string[];
    state: any;
}
export type WorkerMessage = WorkerState | WorkerAction;
