import {Injectable, utc} from "@hypertype/core";
import {StateService} from "@services";
import {IState} from "./tree.template";
import {Context, Message} from "@model";
import {TreeItem, TreePresenter} from "../../presentors/tree.presentor";
import type {Reducer} from "./tree.component";
import {log} from "@hypertype/infr";
import {MessageJSON} from "@domain";
import { ulid } from "ulid";


export type ReducerStore<TState> = {
    [key: string]: Promise<Reducer<TState>>
};

@Injectable()
export class TreeStore {

    constructor(private stateService: StateService) {
    }

    @logReducer
    async UpdateContent(data: {item: TreeItem, content: string}): Promise<Reducer<IState>> {
        return state => {
            this.stateService.UpdateContent(data.item.Message, data.content);
            data.item.Message.Content = data.content;
            return ({...state, Selected: data.item});
        }
    }


    @logReducer
    async Init(root: Context): Promise<Reducer<IState>> {
        return state => {
            if (root.Messages.length == 0) {
                const message: Message = {
                    Content: 'Добро пожаловать!',
                    Context: root,
                    CreatedAt: utc(),
                    UpdatedAt: utc(),
                    id: ulid(),
                    Order: 0
                };
                this.stateService.AddMessage(message);
                root.Messages.push(message);
            }
            // state.ItemsMap = new Map<string, TreeItem>();
            const items = TreePresenter.ToTree(root, state.ItemsMap);
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

    @logReducer
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
                    Content: message.Content,
                    SubContext: message.SubContext ? {
                        URI: message.SubContext.id
                    } : undefined,
                };
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
        const clipboard = event.clipboardData.getData("text/plain")
                        ?? await navigator.clipboard.readText();
        return (state: IState) => {
            try {
                const parsed = JSON.parse(clipboard);
                if (parsed.Content) {
                    if (parsed.SubContext) {
                        // await this.persistanceService.Load(parsed.SubContext.URI)
                        parsed.SubContext = state.Items.map(x => x.Message.Context)

                            .find(x => x.id == parsed.SubContext.id);
                    }
                    this.AddMessage(parsed, state.Selected.Message);
                }
            } catch (e) {
                const paragraphs = clipboard.split('\n');
                for (let paragraph of paragraphs) {
                    this.AddMessage({
                        id: ulid(),
                        Content: paragraph,
                        CreatedAt: utc(),
                        UpdatedAt: utc(),
                        Order: state.Selected.Message.Context.Messages.length
                    }, state.Selected.Message);
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
                Items: TreePresenter.ToTree(state.Root, state.ItemsMap)
            };
        }
    }

    private AddMessage(newMessage: Message, to: Message): Message {
        if (to.SubContext == null) {
            this.stateService.CreateSubContext(to);
        }
        // newMessage.id = `${+utc()}`;
        newMessage.Context = to.SubContext;
        newMessage.Context.Messages.push(newMessage);
        this.stateService.AddMessage(newMessage);
        return newMessage;
    }

    private CreateMessage(getParentPath: (state: IState) => string[]): Reducer<IState> {
        return state => {
            const parentPath = getParentPath(state);
            const newMessage: Message = {
                id: ulid(),
                CreatedAt: utc(),
                UpdatedAt: utc(),
                Content: '',
                Order: 0
            };
            if (parentPath.length > 0) {
                this.AddMessage(newMessage, state.ItemsMap.get(parentPath.join('/')).Message);
            } else {
                newMessage.Context = state.Root;
                state.Root.Messages.push(newMessage);
                this.stateService.AddMessage(newMessage);
            }
            const newPath = [
                ...parentPath,
                newMessage.id,
            ];
            const newItem = {
                Message: newMessage,
                Path: newPath,
                IsOpened: true
            } as TreeItem;
            state.ItemsMap.set(newPath.join('/'), newItem);
            state.Items = TreePresenter.ToTree(state.Root, state.ItemsMap);
            return {
                ...state,
                Selected: newItem
            };
        }
    }

    @logReducer
    async AddChild(event: KeyboardEvent): Promise<Reducer<IState>> {
        return this.CreateMessage(state => state.Selected.Path);
    }

    @logReducer
    async AddNext(event: KeyboardEvent): Promise<Reducer<IState>> {
        return this.CreateMessage(state => state.Selected.Path.slice(0, -1));
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
            const prev = state.Items[selectedIndex - 1];

            this.stateService.DeleteMessage(message);
            const items = state.Items.filter(x => x != state.Selected);
            if (next && next.Message.Context == message.Context) {
                return {
                    ...state,
                    Items: items,
                    Selected: next,
                };
            } else {
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
            if (prevMessage.SubContext == null) {
                this.stateService.CreateSubContext(prevMessage);
            }
            this.stateService.MoveMessage(message, prevMessage.SubContext);
            const newPath = [...state.Selected.Path.slice(0, -1), prevMessage.id, message.id];
            state.Selected.Path = newPath;
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

            this.stateService.MoveMessage(message, parent.Message.Context, parentIndex + 1);
            const newPath = [...parent.Path.slice(0, -1), message.id];
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
            this.stateService.Reorder(message, messageIndex - 1);
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
            this.stateService.Reorder(message, messageIndex + 1);
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
    [key: string]: keyof TreeStore
} = {
    CtrlArrowLeft: "MoveLeft",
    CtrlArrowRight: "MoveRight",
    CtrlArrowUp: "MoveUp",
    CtrlArrowDown: "MoveDown",
    ShiftDelete: "Remove",
    ArrowDown: "Down",
    ArrowUp: "Up",
    CtrlEnter: "AddChild",
    Enter: "AddNext",
    Paste: "Paste",
    Copy: "Copy",
    CtrlPeriod: "Switch"
}

function logReducer(target, key, descr){
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
