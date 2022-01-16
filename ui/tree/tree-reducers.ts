import {IState} from "./tree.template";
import {Message} from "@model";
import {TreeItem, TreePresenter} from "../../presentors/tree.presentor";
import type {Reducer} from "./tree.component";
import {Fn, Injectable, utc} from "@cmmn/core";
import {ContextProxy} from "@services";
import {ulid} from "ulid";


export type ReducerStore<TState> = {
    [key: string]: Promise<Reducer<TState>>
};

@Injectable()
export class TreeReducers {

    constructor(private treePresenter: TreePresenter) {
    }

    @logReducer
    async UpdateContent(data: { item: TreeItem, content: string }): Promise<Reducer<IState>> {
        return state => {
            data.item.Message.Actions.UpdateText(data.content);
            // this.stateService.UpdateContent(data.item.Message, data.content);
            // data.item.Message.Content = data.content;
            return ({...state, Selected: data.item});
        }
    }

    Init(root: ContextProxy): Reducer<IState> {
        return state => {
            // if (root.Messages.length == 0) {
            //     const message: Message = {
            //         Content: 'Добро пожаловать!',
            //         Context: root,
            //         CreatedAt: utc(),
            //         UpdatedAt: utc(),
            //         id: ulid(),
            //         Order: 0
            //     };
            //     this.stateService.AddMessage(message);
            //     root.Messages.push(message);
            // }
            // state.ItemsMap = new Map<string, TreeItem>();
            const items = this.treePresenter.ToTree(root, state.ItemsMap);
            // const items = TreePresenter.ToTree(root, new Map());
            const selected = (() => {
                if (state?.Selected) {
                    const existed = state.ItemsMap.get(state.Selected.Path.join(TreePresenter.Separator));
                    if (!existed) {
                        return items[0];
                    }
                    return existed;
                }
                return items[0];
            })();
            const newState = ({
                ...state,
                Root: root,
                Selected: selected,
                Items: items
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
                    state.Selected.Message.Context.Actions.CreateMessage(parsed);
                }
            } catch (e) {
                const paragraphs = clipboard.split('\n');
                for (let paragraph of paragraphs) {
                    state.Selected.Message.AddMessage({
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
            state.Selected.IsOpened = !state.Selected.IsOpened;
            return {
                ...state,
                Items: this.treePresenter.ToTree(state.Root, state.ItemsMap)
            };
        }
    }


    private CreateMessage(getParentPath: (state: IState) => string[], text = ''): Reducer<IState> {
        return state => {
            const parentPath = getParentPath(state);
            const newMessage: Message = {
                id: Fn.ulid(),
                CreatedAt: utc(),
                UpdatedAt: utc(),
                Content: text,
            };
            const messageProxy = (() => {
                if (parentPath.length > 0) {
                    return state.ItemsMap.get(parentPath.join('/')).Message.AddMessage(newMessage);
                } else {
                    state.Root.Actions.CreateMessage(newMessage);
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
            state.Items = this.treePresenter.ToTree(state.Root, state.ItemsMap);
            return {
                ...state,
                Selected: newItem
            };
            return state;
        }
    }

    @logReducer
    async AddChild(event: KeyboardEvent | InputEvent): Promise<Reducer<IState>> {
        const text = (event.target instanceof HTMLInputElement) ? event.target.value : '';
        return this.CreateMessage(state => state.Selected?.Path ?? [], text);
    }

    @logReducer
    async AddNext(event: KeyboardEvent): Promise<Reducer<IState>> {
        const text = (event.target instanceof HTMLInputElement) ? event.target.value : '';
        return this.CreateMessage(state => state.Selected?.Path?.slice(0, -1) ?? [], text);
    }

    @logReducer
    async Down(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            const selectedIndex = state.Items.indexOf(state.Selected);
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
            const selectedIndex = state.Items.indexOf(state.Selected);
            if (selectedIndex < 0)
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
            const message = state.Selected.Message;
            const selectedIndex = state.Items.indexOf(state.Selected);
            const next = state.Items[selectedIndex + 1];
            const items = state.Items.filter(x => x != state.Selected);
            if (next && next.Message.Context == message.Context) {
                message.Actions.Remove();
                return {
                    ...state,
                    Items: items,
                    Selected: next,
                };
            } else {
                const prev = state.Items[selectedIndex - 1];
                message.Actions.Remove();
                return {
                    ...state,
                    Items: items,
                    Selected: prev,
                };
            }
        }
    }

    @logReducer
    async MoveRight(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
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
    async MoveLeft(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            const message = state.Selected.Message;
            if (state.Selected.Path.length < 2)
                // root children shouldn`t move left
                return state;

            const parent = state.ItemsMap.get(state.Selected.Path.slice(0, -1).join(TreePresenter.Separator));
            const parentIndex = parent.Message.Context.Messages.indexOf(parent.Message);

            message.Actions.Move(message.State.ContextURI, parent.Message.State.ContextURI, parentIndex + 1);
            const newPath = [...parent.Path.slice(0, -1), message.State.id];
            state.Selected.Path = newPath;
            state.ItemsMap.delete(state.Selected.Path.join(TreePresenter.Separator));
            state.ItemsMap.set(newPath.join(TreePresenter.Separator), state.Selected);
            const parentItemIndex = state.Items.indexOf(parent);
            state.Items.remove(state.Selected);
            state.Items.splice(parentItemIndex + parent.Length, 0, state.Selected);
            parent.Length--;
            return {
                ...state,
            }
        }
    }

    @logReducer
    async MoveUp(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            const message = state.Selected.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == 0)
                return state;
            message.Actions.Reorder(messageIndex - 1);
            const itemIndex = state.Items.indexOf(state.Selected);
            state.Items.remove(state.Selected);
            state.Items.splice(itemIndex - 1, 0, state.Selected)
            return {
                ...state,
            }
        }
    }

    @logReducer
    async MoveDown(event: KeyboardEvent): Promise<Reducer<IState>> {
        return (state: IState) => {
            const message = state.Selected.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == message.Context.Messages.length - 1)
                return state;
            message.Actions.Reorder(messageIndex + 1);
            const itemIndex = state.Items.indexOf(state.Selected);
            state.Items.remove(state.Selected);
            state.Items.splice(itemIndex + 1, 0, state.Selected)
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
