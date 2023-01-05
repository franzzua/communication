import {ContentEditableState} from "./types";
import {Message} from "@model";
import {TreeItem, TreePresenter} from "../../presentors/tree.presentor";
import type {Reducer} from "../reducers";
import {Fn, Injectable, utc} from "@cmmn/core";

export class ContentEditableReducers {

    async Focus(x: TreeItem): Promise<Reducer<ContentEditableState>> {
        return (state: ContentEditableState) => ({
            ...state,
            Selected: x
        });
    }

    @logReducer
    async Copy(event: ClipboardEvent): Promise<Reducer<ContentEditableState>> {
        return (state: ContentEditableState) => {
            const message = state.Selection?.Focus?.item.item.Message;
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
    async Paste(event: ClipboardEvent): Promise<Reducer<ContentEditableState>> {
        const clipboard = event.clipboardData?.getData("text/plain")
            ?? await navigator.clipboard.readText();
        return (state: ContentEditableState) => {
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
                    state.Selection?.Focus?.item.item.Message.Context.Actions.CreateMessage(parsed);
                }
            } catch (e) {
                const paragraphs = clipboard.split('\n');
                for (let paragraph of paragraphs) {
                    state.Selection?.Focus?.item.item.Message.AddMessage({
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
    async Switch(event: KeyboardEvent): Promise<Reducer<ContentEditableState>> {
        return (state: ContentEditableState) => {
            if (state.Selection) {
                // TODO:
                // state.Selection.Focus.item.IsOpened = !state.Selection?.Focus?.item.IsOpened;
            }
            return state;
        }
    }


    @logReducer
    async Remove(event: KeyboardEvent): Promise<Reducer<ContentEditableState>> {
        return (state: ContentEditableState) => {
            const item = state.Selection?.Focus.item.item;
            const message = item.Message;
            const selectedIndex = item.Index;
            const next = state.Items[selectedIndex + 1];
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
    async MoveRight(event: KeyboardEvent): Promise<Reducer<ContentEditableState>> {
        return (state: ContentEditableState) => {
            const selectedItem = state.Selection?.Focus.item.item;
            const message = selectedItem.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == 0)
                return state;
            const prevMessage = message.Context.Messages[messageIndex - 1];

            const subContext = prevMessage.GetOrCreateSubContext();
            message.MoveTo(subContext, subContext.Messages.length);
            console.log('move', message.State.Content, 'to', prevMessage.State.Content);
            return state;
        }
    }

    @logReducer
    async MoveLeft(event: KeyboardEvent): Promise<Reducer<ContentEditableState>> {
        return (state: ContentEditableState) => {
            const selectedItem = state.Selection?.Focus.item.item;
            const message = selectedItem.Message;
            if (selectedItem.Path.length < 2)
                // root children shouldn`t move left
                return state;

            const parent = selectedItem.Parent;
            const parentIndex = parent.Message.Context.Messages.indexOf(parent.Message);
            selectedItem.Message.MoveTo(parent.Message.Context, parentIndex + 1);
            return state;
        }
    }

    @logReducer
    async MoveUp(event: KeyboardEvent): Promise<Reducer<ContentEditableState>> {
        return (state: ContentEditableState) => {
            const selectedItem = state.Selection?.Focus.item;
            const message = selectedItem.item.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == 0)
                return state;
            message.Actions.Reorder(messageIndex - 1);
            return state;
        }
    }

    @logReducer
    async MoveDown(event: KeyboardEvent): Promise<Reducer<ContentEditableState>> {
        return (state: ContentEditableState) => {
            const selectedItem = state.Selection?.Focus.item;
            const message = selectedItem.item.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == message.Context.Messages.length - 1)
                return state;
            message.Actions.Reorder(messageIndex + 1);
            return {
                ...state,
            }
        }
    }

    AddMessage(data: { item: TreeItem; content: string; index: number }): Reducer<ContentEditableState> {
        return state => {
            const newMessage = data.item.Message.Context.CreateMessage({
                Content: data.content,
                id: Fn.ulid(),
                CreatedAt: utc(),
                UpdatedAt: utc(),
                ContextURI: data.item.Message.Context.State.URI,
            }, data.index);
            return state;
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
            const reducer: Reducer<ContentEditableState> = await descr.value.call(instance, data);
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
