import {Injectable} from "@hypertype/core";

@Injectable()
export class ActionService {
    constructor() {
    }

    private Map = new Map<string, Action>();

    public Invoke(action: string) {
        if (this.Map.has(action)) {
            this.Map.get(action)();
        }
    }

    public Register(name: string, action: Action) {
        this.Map.set(name, action);
    }
}

export type AsyncAction = () => Promise<void>;
export type SyncAction = () => void;

export type Action = SyncAction | AsyncAction;