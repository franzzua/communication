import {Message} from "@model";
import {TreeItem, TreePresenter} from "../../presentors/tree.presentor";
import type {Reducer} from "../reducers";
import {Fn, Injectable, utc} from "@cmmn/core";
import {ContextProxy} from "@services";
import {TreeState} from "./types";
import {IContextProxy} from "@proxy";


export type ReducerStore<TState> = {
    [key: string]: Promise<Reducer<TState>>
};

@Injectable()
export class TreeReducers {

    constructor(private treePresenter: TreePresenter) {
    }

    @logReducer
    async UpdateContent(data: { item: TreeItem, content: string }): Promise<Reducer<TreeState>> {
        return state => {
            data.item.Message.UpdateContent(data.content);
            // this.stateService.UpdateContent(data.item.Message, data.content);
            // data.item.Message.Content = data.content;
            return ({...state, Selected: data.item});
        }
    }

    Init(root: IContextProxy): Reducer<TreeState> {
        return state => {
            const newState = ({
                ...state,
                Root: root,
            });
            return newState;
        }
    }

    async Focus(x: TreeItem): Promise<Reducer<TreeState>> {
        return (state: TreeState) => ({
            ...state,
            Selected: x
        });
    }

    @logReducer
    async Copy(event: ClipboardEvent): Promise<Reducer<TreeState>> {
        return (state: TreeState) => {
            const message = state.Selected?.Message;
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
    async Paste(event: ClipboardEvent): Promise<Reducer<TreeState>> {
        const clipboard = event.clipboardData?.getData("text/plain")
            ?? await navigator.clipboard.readText();
        return (state: TreeState) => {
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
                    state.Selected.Message.Context.CreateMessage(parsed);
                }
            } catch (e) {
                const paragraphs = clipboard.split('\n');
                for (let paragraph of paragraphs) {
                    state.Selected.Message.AddMessage({
                        id: Fn.ulid(),
                        Content: paragraph,
                        ContextURI: undefined,
                        CreatedAt: utc(),
                        UpdatedAt: utc(),
                    });
                }
            }
            return state;
        }
    }

    @logReducer
    async Switch(event: KeyboardEvent): Promise<Reducer<TreeState>> {
        return (state: TreeState) => {
            state.Selected.IsOpened = !state.Selected.IsOpened;
            this.treePresenter.UpdateTree(state)
            return {
                ...state,
            };
        }
    }


    private async CreateMessage(getParentPath: (state: TreeState) => string[], text = ''): Promise<Reducer<TreeState>> {
        return state => {
            const parentPath = getParentPath(state);
            const newMessage: Message = {
                id: Fn.ulid(),
                ContextURI: undefined,
                CreatedAt: utc(),
                UpdatedAt: utc(),
                Content: text,
            };
            const messageProxy = (() => {
                if (parentPath.length > 0) {
                    return state.ItemsMap.get(parentPath.join('/')).Message.AddMessage(newMessage);
                } else {
                    state.Root.CreateMessage(newMessage);
                    return state.Root.MessageMap.get(newMessage.id);
                }
            })();
            const newPath = [
                ...parentPath,
                newMessage.id,
            ];
            const newItem = {
                Message: messageProxy,
                Path: newPath,
                IsOpened: true
            } as TreeItem;
            state.ItemsMap.set(newPath.join('/'), newItem);
            this.treePresenter.UpdateTree(state);
            return {
                ...state,
                Selected: newItem
            };
            return state;
        }
    }

    @logReducer
    async AddChild(event: KeyboardEvent | InputEvent): Promise<Reducer<TreeState>> {
        const text = (event.target instanceof HTMLInputElement) ? event.target.value : '';
        return this.CreateMessage(state => state.Selected?.Path ?? [], text);
    }

    @logReducer
    async AddNext(event: KeyboardEvent): Promise<Reducer<TreeState>> {
        const text = (event.target instanceof HTMLInputElement) ? event.target.value : '';
        return this.CreateMessage(state => state.Selected?.Path?.slice(0, -1) ?? [], text);
    }

    @logReducer
    async Down(event: KeyboardEvent): Promise<Reducer<TreeState>> {
        return (state: TreeState) => {
            const selectedIndex = state.Items.indexOf(state.Selected);
            if (selectedIndex >= state.Items.length - 1)
                return state;
            return {
                ...state,
                Selected: state.Items.at(selectedIndex + 1),
            };
        }
    }

    @logReducer
    async Up(event: KeyboardEvent): Promise<Reducer<TreeState>> {
        return (state: TreeState) => {
            const selectedIndex = state.Items.indexOf(state.Selected);
            if (selectedIndex < 0)
                return state;
            return {
                ...state,
                Selected: state.Items.at(selectedIndex - 1),
            };
        }
    }

    @logReducer
    async Remove(event: KeyboardEvent): Promise<Reducer<TreeState>> {
        return (state: TreeState) => {
            const message = state.Selected.Message;
            const selectedIndex = state.Items.indexOf(state.Selected);
            const next = state.Items.at(selectedIndex + 1);
            state.Items.remove(state.Selected);
            if (next && next.Message.Context == message.Context) {
                message.Context.RemoveMessage(message);
                return {
                    ...state,
                    Selected: next,
                };
            } else {
                const prev = state.Items.at(selectedIndex - 1);
                message.Context.RemoveMessage(message);
                return {
                    ...state,
                    Selected: prev,
                };
            }
        }
    }

    @logReducer
    async MoveRight(event: KeyboardEvent): Promise<Reducer<TreeState>> {
        return (state: TreeState) => {
            const message = state.Selected.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == 0)
                return state;
            const prevMessage = message.Context.Messages[messageIndex - 1];
            const newMessage = prevMessage.AddMessage(message.State);
            // if (prevMessage.SubContext == null) {
            //     this.stateService.CreateSubContext(prevMessage);
            // }
            // this.stateService.MoveMessage(message, prevMessage.SubContext.State);
            const newPath = [...state.Selected.Path.slice(0, -1), prevMessage.State.id, message.State.id];
            state.Selected.Path = newPath;
            state.Selected.Message = newMessage;
            state.ItemsMap.delete(state.Selected.Path.join(TreePresenter.Separator));
            state.ItemsMap.set(newPath.join(TreePresenter.Separator), state.Selected);
            const newParentItem = state.ItemsMap.get(state.Selected.Path.slice(0, -1).join(TreePresenter.Separator));
            newParentItem.Length++;
            return {
                ...state,
            }
        }
    }

    @logReducer
    async MoveLeft(event: KeyboardEvent): Promise<Reducer<TreeState>> {
        return (state: TreeState) => {
            const message = state.Selected.Message;
            if (state.Selected.Path.length < 2)
                // root children shouldn`t move left
                return state;

            const parent = state.ItemsMap.get(state.Selected.Path.slice(0, -1).join(TreePresenter.Separator));
            const parentIndex = parent.Message.Context.Messages.indexOf(parent.Message);

            message.MoveTo(parent.Message.Context, parentIndex + 1);
            const newPath = [...parent.Path.slice(0, -1), message.State.id];
            state.Selected.Path = newPath;
            state.ItemsMap.delete(state.Selected.Path.join(TreePresenter.Separator));
            state.ItemsMap.set(newPath.join(TreePresenter.Separator), state.Selected);
            const parentItemIndex = state.Items.indexOf(parent);
            state.Items.remove(state.Selected);
            state.Items.insert(parentItemIndex + parent.Length, state.Selected);
            parent.Length--;
            return {
                ...state,
            }
        }
    }

    @logReducer
    async MoveUp(event: KeyboardEvent): Promise<Reducer<TreeState>> {
        return (state: TreeState) => {
            const message = state.Selected.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == 0)
                return state;
            message.MoveTo(message.Context, messageIndex - 1);
            const itemIndex = state.Items.indexOf(state.Selected);
            state.Items.remove(state.Selected);
            state.Items.insert(itemIndex - 1, state.Selected)
            return {
                ...state,
            }
        }
    }

    @logReducer
    async MoveDown(event: KeyboardEvent): Promise<Reducer<TreeState>> {
        return (state: TreeState) => {
            const message = state.Selected.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == message.Context.Messages.length - 1)
                return state;
            message.MoveTo(message.Context, messageIndex + 1);
            const itemIndex = state.Items.indexOf(state.Selected);
            state.Items.removeAt(itemIndex);
            state.Items.insert(itemIndex + 1, state.Selected)
            return {
                ...state,
            }
        }
    }
}


export const keyMap: {
    [key: string]: keyof TreeReducers
} = {
    CtrlArrowLeft: "MoveLeft",
    CtrlArrowRight: "MoveRight",
    CtrlArrowUp: "MoveUp",
    CtrlArrowDown: "MoveDown",
    CtrlKeyC: "Copy",
    CtrlKeyV: "Paste",
    ShiftDelete: "Remove",
    ArrowDown: "Down",
    ArrowUp: "Up",
    CtrlEnter: "AddChild",
    CtrlNumpadEnter: "AddChild",
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
            const reducer: Reducer<TreeState> = await descr.value.call(instance, data);
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
