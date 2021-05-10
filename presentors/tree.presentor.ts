import { log } from "@hypertype/infr";
import { Context, Message } from "@model";

export class TreePresenter{

    public static Separator = '/'

    public static ToTree(context: Context, itemsMap: Map<string, TreeItem>, path = []): TreeItem[]{
        if (!context)
            return [];
        // if (this.contexts.has(context.id)){
        //     return [{
        //         Message: {Content: 'Circular', id: context.id},
        //         Level: level,
        //         IsOpened: false,
        //         HasSubItems: true,
        //     }];
        // }
        // this.contexts.set(context.id, context);
        const result = context.Messages
            .flatMap((msg, index) => {
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
                }else{
                    existed.Message = msg;
                }
                if (existed.IsOpened && existed.Message.SubContext) {
                    const subContextTree = TreePresenter.ToTree(msg.SubContext, itemsMap, existed.Path);
                    existed.Length = subContextTree.length;
                    return ([
                        existed,
                        ...subContextTree
                    ]);
                }
                return ([
                    existed,
                ]);
            });
        // console.log('tree', result);
        return result;
    }
}

export type TreeItem =  {
    Path: string[];
    Message: Message;
    IsOpened: boolean;
    Length: number;
    // HasSubItems: boolean;
}
