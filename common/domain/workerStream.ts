import {cell} from "@common/core";
import {cellx} from "cellx";
import {ObservableMap} from "cellx-collections";
import {Action, Stream} from "./stream";

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
        }
    })


    async Invoke(action: Action) {
        this.Worker.postMessage(action);
    }

    getCell(model: string, id: any) {
        return cellx(() => {
            const map = this.Models();
            return map.get(`${model}`)?.get(`${id}`);
        })
    }

}

export type WorkerAction = Action & {

}