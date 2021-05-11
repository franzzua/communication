import {Component, HyperComponent} from "@hypertype/ui";
import {IEvents, IState, Template} from "./concord.template";
import {BehaviorSubject} from "@hypertype/core";
import {Concord} from "./concord";
const {crdtlib} = require("@concordant/c-crdtlib");

@Component({
    name: 'ctx-concord',
    template: Template,
    style: require('./concord.style.less')
})
export class ConcordComponent extends HyperComponent<IState, IEvents> {

    private state: IState = {
        A: {
            set: Concord.RGA(Concord.Environment("A")),
            history: []
        },
        B: {
            set: Concord.RGA(Concord.Environment("B")),
            history: []
        },
    };

    public State$ = new BehaviorSubject(this.state);

    public Events = {
        add: ({replica, value}) => {
            const newSet = this.state[replica].set.insertAt(0, value);
            this.state[replica].history.unshift({action: `add`, value: value});
            this.State$.next(this.state);
        },

        remove: ({replica, value}) => {
            const index = this.state[replica].set.get().toArray().indexOf(value);
            if (index < 0)
                return;
            const newSet = this.state[replica].set.removeAt(index);
            this.state[replica].history.unshift({action: `rem`, value: value});
            this.State$.next(this.state);
        },

        mergeAtoB: () => {
            const bState = this.state.B.set.env.getState();
            const aDelta  = this.state.A.set.generateDelta(bState);
            this.state.B.set.merge(aDelta);
            this.state.B.history.unshift({action: `merge`, value: this.state.B.set.get()});
            this.state.A.history.unshift({action: `split`, value: aDelta});
            this.State$.next(this.state);
        },

        mergeBtoA: () => {
            const aState = this.state.A.set.env.getState();
            const bDelta  = this.state.B.set.generateDelta(aState);
            this.state.A.set.merge(bDelta);
            this.state.A.history.unshift({action: `merge`, value: this.state.A.set.get()});
            this.state.B.history.unshift({action: `split`, value: bDelta.toJson()});
            this.State$.next(this.state);
        }
    }
}
