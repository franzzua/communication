import {EventEmitter} from "@cmmn/core";
import {IContextProxy} from "@proxy";
import {TreeItem} from "../../presentors/tree.presentor";

export class ItemsCollection extends EventEmitter<any> {
    static MaxDepth = 5;
    constructor(private root: IContextProxy) {
        super();
    }

    public* [Symbol.iterator](): IterableIterator<TreeItem> {
        for (let treeItem of this.iterate(this.root)) {
            yield treeItem;
        }
    }

    private* iterate(context: IContextProxy, path = [],
                     counter = {index: 0},
                     parent: TreeItem = null): IterableIterator<TreeItem> {
        for (let msg of context.Messages) {
            if (!msg.State)
                throw new Error('msg with empty state');
            const level = path.length;
            const newPath = [...path, msg.State.id];
            const existed = {
                Message: msg,
                get State(){
                    return this.Message.State;
                },
                Path: newPath,
                IsOpened: level < ItemsCollection.MaxDepth,
                Length: 1,
                Index: counter.index++,
                Parent: parent
            } as TreeItem;
            yield existed;
            if (existed.IsOpened && existed.Message.SubContext) {
                for (let treeItem of this.iterate(existed.Message.SubContext, newPath, counter, existed)) {
                    yield treeItem;
                }
            }
        }
    }

}

