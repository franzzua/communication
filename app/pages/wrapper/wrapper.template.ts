import {ITemplate} from "@cmmn/ui";
import {DomainState} from "@model";
import {IAccountInfo} from "@infr/account.manager";

export const template: ITemplate<IState, IEvents> = (html, state, events) => html`
    ${state.Children}
    <div class="toolbar">
        ${Object.entries(state.Servers).map(([url, state]) => html(url)`<div>
            ${url}:${state}
        </div>`)}
        ${state.Accounts.map(acc => html(acc.id)`<div>
            ${acc.title}
            <button .acc=${acc} onclick=${events.logout(e => e.target.acc)}>logout</button>
        </div>`)}
        ${state.Accounts.length == 0 ? html('login')`
            <button onclick=${events.login()}>login</button>
        ` : undefined}
    </div>
`;

export type IState = {
    Children: Element[];
    Servers: DomainState["Servers"];
    Accounts: IAccountInfo[];
}

export type IEvents = {
    logout(acc: IAccountInfo);
    login();
}
