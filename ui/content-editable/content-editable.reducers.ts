import {ContentEditableState as IState} from "./types";
import {Message} from "@model";
import {TreeItem, TreePresenter} from "../../presentors/tree.presentor";
import type {Reducer} from "../reducers";
import {Fn, Injectable, utc} from "@cmmn/core";
import {ContextProxy} from "@services";
import {ItemSelection} from "./itemSelection";


export type ReducerStore<TState> = {
    [key: string]: Promise<Reducer<TState>>
};

@Injectable()
export class ContentEditableReducers {

    constructor(private treePresenter: TreePresenter) {
    }

    @logReducer
    async UpdateContent(data: { item: TreeItem, content: string }): Promise<Reducer<IState>> {
        return state => {
            data.item.Message.Actions.UpdateText(data.content);
            // this.stateService.UpdateContent(data.item.Message, data.content);
            // data.item.Message.Content = data.content;
            return ({ ...state, Selected: data.item });
        }
    }

    Init(root: ContextProxy): Reducer<IState> {
        return state => {
            state.Root = root;
            this.treePresenter.UpdateTree(state);
            // const items = TreePresenter.ToTree(root, new Map());
            // const selected = (() => {
            //     if (state?.Selected) {
            //         const existed = state.ItemsMap.get(state.Selected.Path.join(TreePresenter.Separator));
            //         if (!existed) {
            //             return state.Items[0];
            //         }
            //         return existed;
            //     }
            //     return state.Items[0];
            // })();
            const newState = ({
                ...state,
                Selection: ItemSelection.GetCurrent<TreeItem>(),
            });
            return newState;
        }
    }

    async Focus(x: TreeItem): Promise<Reducer<IState>> {
        return (state: IState) => ({
            ...state,
            Selected: x
        });
    }

    @logReducer
    async Copy(event: ClipboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            const message = state.Selection?.Focus?.item.Message;
            if (message) {
                const json = {
                    Content: message.State.Content,
                    SubContextURI: message.SubContext?.State?.URI
                } as Message;
                if (event.clipboardData) {
                    event.clipboardData.setData("text/plain", JSON.stringify(json));
                } else {
                    navigator.clipboard.writeText(JSON.stringify(json)).catch(err => {
                        console.error(err);
                    });
                }
            }
            return state;
        }
    }

    @logReducer
    async Paste(event: ClipboardEvent): Promise<Reducer<IState>> {
        const clipboard = event.clipboardData?.getData("text/plain")
            ?? await navigator.clipboard.readText();
        return (state: IState) => {
            try {
                const parsed = JSON.parse(clipboard) as Message;
                if (parsed.Content) {
                    // if (parsed.SubContext) {
                    //     // await this.persistanceService.Load(parsed.SubContext.URI)
                    //     parsed.SubContext = state.Items.map(x => x.Message.Context)
                    //
                    //         .find(x => x.URI == parsed.SubContext.URI);
                    // }
                    parsed.id = Fn.ulid();
                    parsed.CreatedAt = utc();
                    parsed.UpdatedAt = utc();
                    state.Selection?.Focus?.item.Message.Context.Actions.CreateMessage(parsed);
                }
            } catch (e) {
                const paragraphs = clipboard.split('\n');
                for (let paragraph of paragraphs) {
                    state.Selection?.Focus?.item.Message.AddMessage({
                        id: Fn.ulid(),
                        Content: paragraph,
                        CreatedAt: utc(),
                        UpdatedAt: utc(),
                    });
                }
            }
            return state;
        }
    }

    @logReducer
    async Switch(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            if (state.Selection) {
                state.Selection.Focus.item.IsOpened = !state.Selection?.Focus?.item.IsOpened;
            }
            this.treePresenter.UpdateTree(state);
            return state;
        }
    }


    @logReducer
    async AddChild(event: KeyboardEvent | InputEvent | string): Promise<Reducer<IState>> {
        const text = typeof event === "string" ? event :
            (event.target instanceof HTMLInputElement) ? event.target.value : '';
        return state => {
            const selectedItem = state.Selection?.Focus.item;
            const selectedIndex = state.Selection?.Focus.index;
            const id = Fn.ulid();
            const newMessageState = {
                id,
                Content: text,
                CreatedAt: utc(),
                UpdatedAt: utc(),
                ContextURI: undefined,
            } as Message;
            const newMessage = selectedItem?.Message.AddMessage(newMessageState)
                ?? state.Root.CreateMessage(newMessageState);
            const newPath = selectedItem?.Path.concat([id]) ?? [id];
            const newItem = {
                Path: newPath,
                Message: newMessage,
                IsOpened: true,
                Length: 0
            };
            state.ItemsMap.set(newPath.join(TreePresenter.Separator), newItem);
            state.Items.insert((selectedIndex ?? -1) + 1, newItem);
            return state;
        }
    }

    @logReducer
    async AddNext(event: KeyboardEvent): Promise<Reducer<IState>> {
        const text = (event.target instanceof HTMLInputElement) ? event.target.value : '';
        return state => {
            const selectedItem = state.Selection?.Focus.item;
            const selectedIndex = state.Selection?.Focus.index;
            const context = selectedItem.Message.Context ?? state.Root;
            const id = Fn.ulid();
            // setTimeout(() =>
            //     context.Actions.CreateMessage(, index), 3000);
            const newPath = selectedItem.Path.slice(0, -1).concat([id]) ?? [id];
            const newMessage = context.MessageMap.get(id);
            newMessage.State = {
                id,
                Content: text,
                CreatedAt: utc(),
                UpdatedAt: utc(),
                ContextURI: context.State.URI,
            };
            context.Actions.CreateMessage(newMessage.State, selectedIndex + selectedItem.Length);
            const newItem = {
                Path: newPath,
                Message: newMessage,
                IsOpened: true,
                Length: 0
            };
            state.ItemsMap.set(newPath.join(TreePresenter.Separator), newItem);
            state.Items.insert(selectedIndex + selectedItem.Length, newItem);
            return { ...state };
        }
    }


    @logReducer
    async Down(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            const selectedIndex = state.Selection?.Focus.index;
            if (selectedIndex >= state.Items.length - 1)
                return state;
            return {
                ...state,
                Selected: state.Items[selectedIndex + 1],
            };
        }
    }

    @logReducer
    async Up(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            const selectedIndex = state.Selection?.Focus.index;
            if (selectedIndex <= 0)
                return state;
            return {
                ...state,
                Selected: state.Items[selectedIndex - 1],
            };
        }
    }

    @logReducer
    async Remove(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            const item = state.Selection?.Focus.item;
            const message = item.Message;
            const selectedIndex = state.Items.toArray().indexOf(item);
            const next = state.Items[selectedIndex + 1];
            state.Items.removeAt(state.Items.toArray().indexOf(item));
            if (next && next.Message.Context == message.Context) {
                message.Actions.Remove();
                return {
                    ...state,
                    Selected: next,
                };
            } else {
                const prev = state.Items[selectedIndex - 1];
                message.Actions.Remove();
                return {
                    ...state,
                    Selected: prev,
                };
            }
        }
    }

    @logReducer
    async MoveRight(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            const selectedItem = state.Selection?.Focus.item;
            const message = selectedItem.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == 0)
                return state;
            const prevMessage = message.Context.Messages[messageIndex - 1];

            const subContext = prevMessage.GetOrCreateSubContext();
            const newMessage = message.MoveTo(subContext, subContext.Messages.length);
            const newPath = [...selectedItem.Path.slice(0, -1), prevMessage.State.id, newMessage.State.id];
            return {
                ...state,
                // Selection: new CaretSelection(newPath, state.Selection?.Focus.offset)
            }
        }
    }

    @logReducer
    async MoveLeft(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            const selectedItem = state.Selection?.Focus.item;
            const message = selectedItem.Message;
            if (selectedItem.Path.length < 2)
                // root children shouldn`t move left
                return state;

            const parent = state.ItemsMap.get(selectedItem.Path.slice(0, -1).join(TreePresenter.Separator));
            const parentIndex = parent.Message.Context.Messages.indexOf(parent.Message);

            selectedItem.Message = message.MoveTo(parent.Message.Context, parentIndex + 1);
            state.ItemsMap.delete(selectedItem.Path.join(TreePresenter.Separator));
            selectedItem.Path = [...parent.Path.slice(0, -1), message.State.id];
            state.ItemsMap.set(selectedItem.Path.join(TreePresenter.Separator), selectedItem);
            // const parentItemIndex = state.Items.toArray().indexOf(parent);
            // state.Items.removeAt(state.Items.toArray().indexOf(selectedItem));
            // state.Items.insert(parentItemIndex + parent.Length, selectedItem);
            // selectedItem.Message = parent.Message.Context.MessageMap.get(message.State.id);
            // selectedItem.Message.State = message.State;
            // parent.Length--;
            return {
                ...state,
            }
        }
    }

    @logReducer
    async MoveUp(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            const selectedItem = state.Selection?.Focus.item;
            const message = selectedItem.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == 0)
                return state;
            message.Actions.Reorder(messageIndex - 1);
            const itemIndex = state.Items.toArray().indexOf(selectedItem);
            state.Items.removeAt(itemIndex);
            state.Items.insert(itemIndex - 1, selectedItem)
            return {
                ...state,
            }
        }
    }

    @logReducer
    async MoveDown(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            const selectedItem = state.Selection?.Focus.item;
            const message = selectedItem.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == message.Context.Messages.length - 1)
                return state;
            message.Actions.Reorder(messageIndex + 1);
            const itemIndex = state.Items.toArray().indexOf(selectedItem);
            state.Items.removeAt(itemIndex);
            state.Items.insert(itemIndex + 1, selectedItem);
            return {
                ...state,
            }
        }
    }

}


export const keyMap: {
    [key: string]: keyof ContentEditableReducers
} = {
    ShiftTab: "MoveLeft",
    Tab: "MoveRight",
    CtrlArrowUp: "MoveUp",
    CtrlArrowDown: "MoveDown",
    CtrlKeyC: "Copy",
    CtrlKeyV: "Paste",
    ShiftDelete: "Remove",
    // ArrowDown: "Down",
    // ArrowUp: "Up",
    ShiftEnter: "AddChild",
    ShiftNumpadEnter: "AddChild",
    NumpadEnter: "AddNext",
    Enter: "AddNext",
    Paste: "Paste",
    Copy: "Copy",
    CtrlPeriod: "Switch"
}

function logReducer(target, key, descr) {
    return {
        async value(data) {
            const instance = this;
            // console.groupCollapsed(key);
            // console.log('reducer', data);
            const reducer: Reducer<IState> = await descr.value.call(instance, data);
            return state => {
                const newState = reducer.call(instance, state);
                // console.info(newState);
                // console.table(newState.Items.map(x => ({id: x.Message.URI, Content: x.Message.Content, Path:x.Path.join('   '), IsOpened: x.IsOpened})));
                // console.groupEnd();
                return newState;
            }
        }
    }
}
