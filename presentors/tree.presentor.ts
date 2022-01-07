import {Context, Message} from "@model";
import {Injectable} from "@common/core";
import {ProxyProvider} from "@services";
import {Permutation} from "@domain/helpers/permutation";

@Injectable()
export class TreePresenter {

    public static Separator = '/';

    private toTree(msg: Message, itemsMap: Map<string, TreeItem>, path = []) {

        const level = path.length;
        const newPath = [...path, msg.id];
        const pathString = newPath.join(TreePresenter.Separator);
        let existed = itemsMap.get(pathString);
        if (existed == null) {
            // console.log('new item', msg.id, pathString);
            existed = {
                Message: msg,
                Path: [...path, msg.id],
                IsOpened: level < 10,
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

    public ToTree(context: Context, itemsMap: Map<string, TreeItem>, path = []): TreeItem[] {
        if (!context)
            return [];
        if (!context.Messages) {
            return [];
        }
        const result = (context.Permutation ?? Permutation.I(context.Messages.length)).Invoke(context.Messages.orderBy(x => x.id)).flatMap(msg => this.toTree(msg, itemsMap, path));
        // console.log('tree', result);
        return result;
    }
}

export type TreeItem = {
    Path: string[];
    Message: Message;
    IsOpened: boolean;
    Length: number;
    // HasSubItems: boolean;
}
