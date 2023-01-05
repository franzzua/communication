import {EventEmitter} from "@cmmn/core";
import {ContextProxy} from "@proxy";
import {TreeItem} from "../../presentors/tree.presentor";

export class ItemsCollection extends EventEmitter<any> {
    constructor(private root: ContextProxy) {
        super();
    }

    public* [Symbol.iterator](): IterableIterator<TreeItem> {
        for (let treeItem of this.iterate(this.root)) {
            yield treeItem;
        }
    }

    private* iterate(context: ContextProxy, path = [],
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
                IsOpened: level < 5,
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

