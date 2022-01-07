import {cellx} from "cellx";
import {ModelPath} from "../shared/types";

export abstract class Model<TState, TActions = {}> {

    public $state = cellx(() => this.State, {
        put: (cell, value) => {
            this.State = value;
        }
    })

    public get State(): Readonly<TState> {
        return this.$state();
    }

    public set State(value: Readonly<TState>) {
        this.$state(value);
    }

    public Actions: TActions = this as any;

    private _queryModel(path: ModelPath, current: any) {
        if (path.length == 0)
            return current;
        const first = path.shift();
        if (current instanceof Map) {
            return this._queryModel(path, current.get(first));
        }
        if (Array.isArray(current)) {
            const result = current.find(x => x.id === first || x.Id === first);
            return this._queryModel(path, result);
        }
        if (first in current)
            return this._queryModel(path, current[first]);
    }

    public QueryModel(path: ModelPath): Model<any, any> {
        return this._queryModel(path, this);
    }
}
