import {Component, HyperComponent} from "@hypertype/ui";
import {IEvents, IState, Template} from "./crdt.template";
import {BehaviorSubject, of} from "@hypertype/core";
import {AworSet} from "../../delta/awor-set";

@Component({
    name: 'ctx-crdt',
    template: Template,
    style: require('./crdt.style.less')
})
export class CrdtComponent extends HyperComponent<IState, IEvents>{

    private state: IState = {
        A: [{action:'init', set: AworSet.Zero<number>().with('A', 1)}],
        B: [{action:'init', set: AworSet.Zero<number>().with('B', 2)}],
    };

    public State$ = new BehaviorSubject(this.state);

    public Events = {
        add: ({replica, value}) => {
            const newSet = this.state[replica][0].set.with(replica,value);
            this.state[replica].unshift({action: `add ${value}`, set: newSet});
            this.State$.next(this.state);
        },

        remove: ({replica, value}) => {
            const newSet = this.state[replica][0].set.without(value);
            this.state[replica].unshift({action: `rem ${value}`, set: newSet});
            this.State$.next(this.state);
        },

        mergeAtoB: () => {
            const newSet = this.state.B[0].set.mergeDelta(this.state.A[0].set.delta);
            this.state.B.unshift({action: `merge`, set: newSet});
            this.state.A.unshift({action: `split`, set: this.state.A[0].set.split().value});
            this.State$.next(this.state);
        },

        mergeBtoA: () => {
            const newSet = this.state.A[0].set.mergeDelta(this.state.B[0].set.delta);
            this.state.A.unshift({action: `merge`, set: newSet});
            this.state.B.unshift({action: `split`, set: this.state.B[0].set.split().value});
            this.State$.next(this.state);
        }
    }
}
