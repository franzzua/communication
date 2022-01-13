import {Context, Message} from "@model";
import {Injectable} from "@common/core";
import {ProxyProvider} from "@services";
import {Permutation} from "@domain/helpers/permutation";
import {ContextModel, MessageModel} from "@domain/model";
import {MessageProxy} from "../services/message-proxy";
import {ContextProxy} from "../services/context-proxy";

@Injectable()
export class TreePresenter {

    public static Separator = '/';

    private toTree(msg: MessageProxy, itemsMap: Map<string, TreeItem>, path = []) {
        if (!msg.State)
            return [];
        const level = path.length;
        const newPath = [...path, msg.State.id];
        const pathString = newPath.join(TreePresenter.Separator);
        let existed = itemsMap.get(pathString);
        if (existed == null) {
            // console.log('new item', msg.id, pathString);
            existed = {
                Message: msg,
                Path: newPath,
                IsOpened: level < 5,
                Length: 0
            };
            itemsMap.set(pathString, existed)
        } else {
            existed.Message = msg;
        }
        if (existed.IsOpened && existed.Message.SubContext) {
            const subContextTree = this.ToTree(msg.SubContext, itemsMap, existed.Path);
            existed.Length = subContextTree.length;
            return ([
                existed,
                ...subContextTree
            ]);
        }
        return ([
            existed,
        ]);
    }

    public ToTree(context: ContextProxy, itemsMap: Map<string, TreeItem>, path = []): TreeItem[] {
        if (!context.State)
            return [];
        if (!context.Messages) {
            return [];
        }
        const result = context.Messages.flatMap(msg => this.toTree(msg, itemsMap, path));
        return result;
    }
}

export type TreeItem = {
    Path: string[];
    Message: MessageProxy;
    IsOpened: boolean;
    Length: number;
    // HasSubItems: boolean;
}
