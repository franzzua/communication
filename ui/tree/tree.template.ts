import {IEventHandler, wire} from "@hypertype/ui";
import {Message} from "@model";

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => html`
    ${state.Items.map((item,index)  => html(`item.${item.Message.id}`)`
    <div item style=${{'--level': item.Level}}>
        <ctx-text-content 
                message=${item.Message}
                data=${{item,index}}
                onfocus=${events.focus(e => e.target.data)} 
                active=${index == state.SelectedIndex} />
    </div>
    `)}
`;

export interface IState {
    Items: Item[];
    SelectedIndex: number;
}

export interface IEvents {
    focus({item: Item, index: number});
}

export  type Item = {
    Level;
    Message: Message;
}
