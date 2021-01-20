import { Context, Message } from "@model";

export class TreePresenter{
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
        const result = context.Messages.flatMap((msg, index) => {
            const level = path.length;
            const newPath = [...path, msg.id];
            const pathString = newPath.join('/');
            let existed = itemsMap.get(pathString);
            if (existed == null) {
                // console.log('new item', msg.id, pathString);
                existed = {
                    Message: msg,
                    Path: [...path, msg.id],
                    IsOpened: level < 10,
                };
                itemsMap.set(pathString, existed)
            }else{
                existed.Message = msg;
            }
            if (existed.IsOpened && existed.Message.SubContext)
                return ([
                    existed,
                    ...TreePresenter.ToTree(msg.SubContext, itemsMap, existed.Path)
                ]);
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
    // HasSubItems: boolean;
}