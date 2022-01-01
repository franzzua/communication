import {IEventHandler} from "@hypertype/ui";
import {IAccountInfo, IAccountProvider} from "@services";
import {Icons} from "../../../icons/Icons";

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => html`
    ${state.providers.map(provider => html(`provider.${provider}`)`
            <button class="add-user"
                    onmouseup=${events.addAccount(e => e.target.data)}
                    data=${provider}
                    >
                    ${ Icons.addUser(html, {}, [], {}) }
                    <span>Add ${provider} account</span>
            </button>
    `)}
    ${state.accounts.map(account => html(`account.${account.title}`)`
        <section>
            <header>${account.title}</header>
            
            <button>logout</button>
            <button data=${account} onclick=${events.clear(x => x.target.data)}>clear</button>
        </section>
    `)}
`;

export interface IState {
        accounts: IAccountInfo[];
        providers: string[];
}

export interface IEvents {
    addAccount(provider);
    clear(account: IAccountInfo);
}
