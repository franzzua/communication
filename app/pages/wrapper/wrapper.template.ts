import {ITemplate} from "@cmmn/ui";
import {DomainState} from "@model";

export const template: ITemplate<IState, IEvents> = (html, state, events) => html`
    ${state.Children}
    <div class="toolbar">
        ${Object.entries(state.Servers).map(([url, state]) => html(url)`<div>
            ${url}:${state}
        </div>`)}
    </div>
`;

export type IState = {
    Children: Element[]; Servers: DomainState["Servers"];
}

export type IEvents = {}
