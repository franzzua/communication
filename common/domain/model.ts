import {cellx} from "cellx";

export abstract class Model<TState, TActions> {

    public $state = cellx(() => this.State, {
        put: (cell, value) => {
            this.State = value;
        }
    })

    public get State(): Readonly<TState>{
        return this.$state();
    }
    public set State(value: Readonly<TState>){
        this.$state(value);
    }
    public abstract Actions: TActions;
}
