import {Injectable} from "@hypertype/core";

@Injectable()
export class ActionService {
    constructor() {
    }

    private Map = new Map<string, Action>();

    public Invoke(action: string, ...args) {
        if (this.Map.has(action)) {
            this.Map.get(action)(...args);
        }
    }

    public Register(name: string, action: Action) {
        this.Map.set(name, action);
    }
}

export type AsyncAction = (...args) => Promise<void>;
export type SyncAction = (...args) => void;

export type Action = SyncAction | AsyncAction;