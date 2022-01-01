import {IEventHandler} from "@hypertype/ui";
import {AworSet} from "../../delta/awor-set";

const replica = (html, state: IReplicaState[], events:IEventHandler<IEvents>, name) => html(name)`
    <div>
        <header>${`${name}: ${state[0].set.values.join(', ')}`}</header>
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
        ${state.map((s,i) => html(`${name}.${i}`)`
        <header>${s.action}</header>
        <div style="display: flex; flex-flow: row; margin: .3em 0; padding: .5em; background: #333;">
            <div>
            ${s.set.kernel.toString().split('\n').map(x => html('')`<div>${x}</div>`)}
            </div>
            <div>
            ${s.set.delta?.toString().split('\n').map(x => html('2')`<div>${x}</div>`)}
            </div>
        </div>
        `)}
    </div>
`;

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => html`
    ${replica(html, state.A, events, 'A')}
    ${replica(html, state.B, events, 'B')}
`;

export interface IReplicaState{
    set: AworSet<number>;
    action: string;
}

export interface IState {
    [key: string]: IReplicaState[];
}

export interface IEvents {
    add({replica: string, value: number});
    remove({replica: string, value: number});
    mergeBtoA();
    mergeAtoB();

}

