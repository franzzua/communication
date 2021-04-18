import {IEventHandler, wire} from "@hypertype/ui";
import {addUser} from "../../../icons/user.add";
import {IAccountInfo, IAccountProvider} from "@services";

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => html`
    ${state.providers.map(provider => html(`provider.${provider}`)`
            <button class="add-user"
                    onmouseup=${events.addAccount(e => e.target.data)}
                    data=${provider}
                    >
                    <svg class="add-user-icon"
                         viewBox="0 0 64 64">
                        ${ addUser(html) }
                    </svg>
                    <span>Add ${provider} account</span>
            </button>
    `)}
    ${state.accounts.map(account => html(`account.${account.title}`)`
        <button>
            ${`logout from ${account.title}`}
        </button>
    `)}
`;

export interface IState {
        accounts: IAccountInfo[];
        providers: string[];
}

export interface IEvents {
    addAccount(provider);
}
