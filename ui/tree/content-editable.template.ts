import { ITemplate } from "@cmmn/ui";
import { TreeItem } from "../../presentors/tree.presentor";
import { ObservableList } from "@cmmn/cell";

export const ContentEditableTemplate: ITemplate<IState, any> = (html, state, events) => html`
    ${state?.toArray().map((item, index) => html(`item.${item.Path.join('.')}`)`
    <span .item=${item} 
         .index=${index}
         style=${{ '--level': item.Path.length - 1 }}
         class=${`item level-${item.Path.length} ${item.Path.length > 3 ? 'li' : ''}`}
         .innerHTML=${item.Message.State?.Content ?? ''}
         />
    `)}
`;

export type IState = ObservableList<TreeItem>;