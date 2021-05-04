import {IEventHandler, wire} from "@hypertype/ui";
import {Concord} from "./concord";

const replica = (html, state: IReplicaState, events:IEventHandler<IEvents>, name) => html(name)`
    <div>
        <header>${`${name}: ${state.set.get()}`}</header>
        <button onclick=${name == 'A' ? events.mergeAtoB(x => x) : events.mergeBtoA(x => x)}>
            ${name == 'A' ? 'merge --->' : '<--- merge'}
        </button>
        <div>
            <span>Add</span>
            ${new Array(10).fill(0).map((_,i) => html(`${name}.add.${i}`)`
            <button data=${{replica: name, value: i}} onclick=${events.add(x => x.target.data)}>${i}</button>
            `)}
        </div>
         <div>
            <span>Rem</span>
            ${new Array(10).fill(0).map((_,i) => html(`${name}.rem.${i}`)`
            <button data=${{replica: name, value: i}} onclick=${events.remove(x => x.target.data)}>${i}</button>
            `)}
        </div>
        ${state.history.map((s,i) => html(`${name}.${i}`)`
        <header>${s.action} ${s.value}</header>
  </div>
  `)}
`;

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => html`
    ${replica(html, state.A, events, 'A')}
    ${replica(html, state.B, events, 'B')}
`;


export interface IReplicaState{
    set: Concord.RGA;
    history: {action: string; value: any;}[]
}

export interface IState {
    A: IReplicaState;
    B: IReplicaState;
}

export interface IEvents {
    add({replica: string, value: number});
    remove({replica: string, value: number});
    mergeBtoA();
    mergeAtoB();

}
