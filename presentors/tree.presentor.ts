import {Injectable} from "@cmmn/core";
import {ContextProxy, MessageProxy} from "@services";
import {ObservableList} from "@cmmn/cell";
import { Message } from "@model";
import {IContextProxy, IMessageProxy} from "@proxy";

@Injectable()
export class TreePresenter {

    public static Separator = '/';

    private updateTree(msg: IMessageProxy, state: IState, path = [], index = 0): number {
        if (!msg.State)
            throw new Error('msg with empty state');
        const level = path.length;
        const newPath = [...path, msg.State.id];
        const pathString = newPath.join(TreePresenter.Separator);
        let existed = state.ItemsMap.get(pathString);
        if (existed == null) {
            // console.log('new item', msg.id, pathString);
            existed = {
                Message: msg,
                Path: newPath,
                IsOpened: level < 5,
                Length: 1
            };
            state.ItemsMap.set(pathString, existed);
            state.Items.insert(index, existed);
        } else {
            const currentIndex = state.Items.toArray().indexOf(existed);
            if (currentIndex !== index){
                if (currentIndex != -1) {
                    state.Items.removeAt(currentIndex);
                }
                state.Items.insert(index, existed);
            }
            existed.Message = msg;
            existed.Length = 1;
            existed.Path = newPath;
        }
        index++;
        if (existed.IsOpened && existed.Message.State.SubContextURI) {
            for (const msg of existed.Message.SubContext.Messages) {
                const length = this.updateTree(msg, state, newPath, index);
                existed.Length += length;
                index += length;
            }
        }
        return existed.Length;
    }

    public UpdateTree(state: IState): void {
        let index = 0;
        for (const msg of state.Root.Messages) {
            index += this.updateTree(msg, state, [], index);
        }
        while (index < state.Items.length){
            state.Items.removeAt(index);
        }
        state.Items.emit('change');
    }
}

export type TreeItem = {
    Index?: number;
    State?: Message;
    Parent?: TreeItem;
    Path: string[];
    Message: IMessageProxy;
    IsOpened: boolean;
    Length: number;
}

export type IState = {
    Items: ObservableList<TreeItem>;
    Root: IContextProxy;
    ItemsMap: Map<string, TreeItem>;
}