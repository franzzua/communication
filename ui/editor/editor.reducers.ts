import {ContentEditableState, EditorItem} from "./types";
import {Message} from "@model";
import type {Reducer} from "../reducers";
import {Fn, Injectable, utc} from "@cmmn/core";

export class EditorReducers {
    public static KeyMap: Record<string, (e) => Promise<Reducer<ContentEditableState>>> = {};

    @logReducer
    @onKeyPress('CtrlKeyC')
    @onKeyPress('Copy')
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
    @onKeyPress('CtrlKeyV')
    @onKeyPress('Paste')
    async Paste(event: ClipboardEvent): Promise<Reducer<ContentEditableState>> {
        const clipboard = event.clipboardData?.getData("text/plain")
            ?? await navigator.clipboard.readText();
        event.preventDefault();
        return (state: ContentEditableState) => {
            try {
                const parsed = JSON.parse(clipboard) as Message;
                if (parsed.Content) {
                    parsed.id = Fn.ulid();
                    parsed.CreatedAt = utc();
                    parsed.UpdatedAt = utc();
                    state.Selection?.Focus?.item.item.Message.Context.CreateMessage(parsed);
                }
            } catch (e) {
                const paragraphs = clipboard.split('\n').map(x => x.trim());
                const target = (state.Selection?.Focus?.item.item ?? state.Items[Symbol.iterator]().next().value) as EditorItem;
                for (let paragraph of paragraphs) {
                    target.Message.AddMessage({
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
    @onKeyPress('ShiftDelete')
    async Remove(event: KeyboardEvent): Promise<Reducer<ContentEditableState>> {
        return (state: ContentEditableState) => {
            const item = state.Selection?.Focus.item.item;
            const message = item.Message;
            const selectedIndex = item.Index;
            const next = state.Items[selectedIndex + 1];
            if (next && next.Message.Context == message.Context) {
                message.Context.RemoveMessage(message);
                return {
                    ...state,
                    Selected: next,
                };
            } else {
                const prev = state.Items[selectedIndex - 1];
                message.Context.RemoveMessage(message);
                return {
                    ...state,
                    Selected: prev,
                };
            }
        }
    }

    @logReducer
    @onKeyPress('Tab')
    async MoveRight(event: KeyboardEvent): Promise<Reducer<ContentEditableState>> {
        return (state: ContentEditableState) => {
            if (state.Selection?.Type === 'Caret') {
                const selectedItem = state.Selection?.Focus.item.item;
                const message = selectedItem.Message;
                const messageIndex = message.Context.Messages.indexOf(message);
                if (messageIndex == 0)
                    return state;
                const prevMessage = message.Context.Messages[messageIndex - 1];

                const subContext = prevMessage.GetOrCreateSubContext();
                message.MoveTo(subContext, subContext.Messages.length);
                return state;
            }
            if (state.Selection?.Type === 'Range') {

                return state;
            }
        }
    }

    @logReducer
    @onKeyPress('ShiftTab')
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
    @onKeyPress('CtrlArrowUp')
    async MoveUp(event: KeyboardEvent): Promise<Reducer<ContentEditableState>> {
        return (state: ContentEditableState) => {
            const selectedItem = state.Selection?.Focus.item;
            const message = selectedItem.item.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == 0)
                return state;
            message.MoveTo(message.Context, messageIndex - 1);
            return state;
        }
    }

    @logReducer
    @onKeyPress('CtrlArrowDown')
    async MoveDown(event: KeyboardEvent): Promise<Reducer<ContentEditableState>> {
        return (state: ContentEditableState) => {
            const selectedItem = state.Selection?.Focus.item;
            const message = selectedItem.item.Message;
            const messageIndex = message.Context.Messages.indexOf(message);
            if (messageIndex == message.Context.Messages.length - 1)
                return state;
            message.MoveTo(message.Context, messageIndex + 1);
            return {
                ...state,
            }
        }
    }
}

export function onKeyPress(keyCode: string){
    return (target, key, descr) => {
        target.constructor.KeyMap[keyCode] = descr.value;
        return descr;
    }
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
