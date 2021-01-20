import {Injectable, utc} from "@hypertype/core";
import {ActionService, EventBus, StateService} from "@services";
import {IState} from "./tree.template";
import {Context, Message} from "@model";
import {TreeItem, TreePresenter} from "../../presentors/tree.presentor";
import {PersistanceService} from "@infr/persistance.service";

@Injectable()
export class TreeKeyboardReducer {

    constructor(private actionService: ActionService,
                private persistanceService: PersistanceService,
                private stateService: StateService) {
    }

    async Copy(event: ClipboardEvent, state: IState): Promise<IState> {
        const message = state.Selected?.Message;
        if (message) {
            const json = {
                Content: message.Content,
                SubContext: message.SubContext ? {
                    URI: message.SubContext.URI
                } : undefined,
            };
            if (event.clipboardData) {
                event.clipboardData.setData("text/plain", JSON.stringify(json));
            } else {
                await navigator.clipboard.writeText(JSON.stringify(json));
            }
        }
        return state;
    }

    async Paste(event: ClipboardEvent, state: IState): Promise<IState> {
        const clipboard = event.clipboardData.getData("text/plain") ??
            await navigator.clipboard.readText();
        try {
            const parsed = JSON.parse(clipboard);
            if (parsed.Content) {
                if (parsed.SubContext) {
                    await this.persistanceService.Load(parsed.SubContext.URI)
                    parsed.SubContext = this.stateService.State.get(parsed.SubContext.URI);
                }
                await this.AddMessage(parsed, state.Selected);
            }
        } catch (e) {
            await this.AddMessage({
                Content: clipboard
            }, state.Selected);
        }
        return state;
    }

    async ['Ctrl.'](event: KeyboardEvent, state: IState): Promise<IState> {
        state.Selected.IsOpened = !state.Selected.IsOpened;
        return {
            ...state,
            Items: TreePresenter.ToTree(state.Root, state.ItemsMap)
        };
    }

    async AddMessage(newMessage: Message, to: TreeItem): Promise<Message> {
        const message = to.Message;
        if (message.SubContext == null) {
            const newContext = {
                id: `${+utc()}`,
                Messages: [],
                Storage: message.Context.Storage,
            } as Context;
            await this.persistanceService.OnCreateContext(newContext);
            await this.stateService.OnCreateContext(newContext);
            await this.persistanceService.OnAttachContext(newContext.id, message);
            await this.stateService.OnAttachContext(newContext.id, message);
        }
        // newMessage.id = `${+utc()}`;
        newMessage.CreatedAt = utc();
        newMessage.Context = to.Message.SubContext;
        await this.persistanceService.OnAddMessage(newMessage);
        await this.stateService.OnAddMessage(newMessage);
        return newMessage;
    }

    async Enter(event: KeyboardEvent, state: IState): Promise<IState> {
        const message = state.Selected.Message;
        if (message.Action != null) {
            this.actionService.Invoke(message.Action, message);
            return state;
        }
        const isLastMessage = (message.Context?.Messages.slice(-1)[0] == message);
        const parentPath = isLastMessage ? state.Selected.Path.slice(0, -1) : state.Selected.Path;
        const newMessage = await this.AddMessage({
            Content: '',
        }, state.ItemsMap.get(parentPath.join('/')));

        const newPath =  [
            ...parentPath,
            newMessage.id,
        ];
        const newItem = {
            Message: newMessage,
            Path: newPath,
            IsOpened: true
        } as TreeItem;
        state.ItemsMap.set(newPath.join('/'), newItem);
        return {
            ...state,
            Selected: newItem
        };
    }

    async ArrowDown(event: KeyboardEvent, state: IState): Promise<IState> {
        const selectedIndex = state.Items.indexOf(state.Selected);
        if (selectedIndex >= state.Items.length)
            return state;
        return {
            ...state,
            Selected: state.Items[selectedIndex + 1],
        };
    }

    async ArrowUp(event: KeyboardEvent, state: IState): Promise<IState> {
        const selectedIndex = state.Items.indexOf(state.Selected);
        if (selectedIndex <= 0)
            return state;
        return {
            ...state,
            Selected: state.Items[selectedIndex - 1],
        };
    }

    async ShiftDelete(event: KeyboardEvent, state: IState): Promise<IState> {
        const message = state.Selected.Message;
        const selectedIndex = state.Items.indexOf(state.Selected);
        const next = state.Items[selectedIndex + 1];
        const prev = state.Items[selectedIndex - 1];

        await this.persistanceService.OnDeleteMessage(message);
        await this.stateService.OnDeleteMessage(message);
        const items = state.Items.filter(x => x != state.Selected);
        if (next.Message.Context == message.Context) {
            const state2 = {
                ...state,
                Items: items,
                Selected: next,
            };
            // console.log('selected', state2.Selected.Message.id.split('#').pop());
            return state2;
        } else {
            return {
                ...state,
                Items: items,
                Selected: prev,
            };
        }

    }
}