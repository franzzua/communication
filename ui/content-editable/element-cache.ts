import {DateTime} from "luxon";
import {Diff} from "./diff-apply";

const Separator = ':';

export class ElementCache<TItem extends {
    Index?: number;
    Path: string[];
    State?: {
        Content: string;
        UpdatedAt: DateTime;
    }
}, TElement extends {
    textContent: string;
    parentElement: TElement;
    id?: string;
    nextSibling: TElement;
}> {
    private cache = new Map<string, ElementInfo<TItem, TElement>>();

    public get(item: TItem | TElement): ElementInfo<TItem, TElement> {
        if (!item)
            return undefined;
        return this.cache.get(this.getKey(item));
    }
    getMergeDiff(items: Iterable<TItem>, firstChild: TElement, fromUI: boolean) {
        const ui = new Diff<TItem, TElement>();
        const model = new Diff<TItem, TElement>();

        const checked = new Set<string>();
        // console.log('_____________');
        for (let item of items) {
            const currentChild = this.get(item);
            if (!currentChild) {
                model.added.push({child: null, item});
                continue;
            }
            if (!currentChild.element.parentElement) {
                ui.deleted.push({child: currentChild.element, item});
                continue;
            }
            checked.add(currentChild.id);
            if (!currentChild.hasChanges(item)) {
                continue;
            }
            if (fromUI) {
                ui.updated.push({child: currentChild.element, item});
            } else {
                model.updated.push({child: currentChild.element, item});
            }
        }

        for (let current = firstChild; current != undefined; current = current.nextSibling) {
            if (checked.has(current.id))
                continue;
            const element = this.cache.get(current.id)
            if (element) {
                //model deleted
                model.deleted.push({child: current, item: element.item});
            } else {
                ui.added.push({child: current});
            }
        }

        if (model.added.length > 0 && model.deleted.length > 0) {
            for (let added of model.added.slice()) {
                const deleted = model.deleted.find(x => x.item.Index == added.item.Index);
                if (deleted) {
                    model.added.remove(added);
                    model.deleted.remove(deleted);
                    model.updated.push(added);
                }
            }
        }
        // console.table(state);
        if (!ui.isEmpty() || !model.isEmpty()) {
            console.table({
                ui: {
                    updated: ui.updated.map(x => x.child.textContent || '-').join(', '),
                    deleted: ui.deleted.map(x => x.item.State.Content || '-').join(', '),
                    added: ui.added.map(x => x.child.textContent || '-').join(', '),
                },
                model: {
                    updated: model.updated.map(x => x.item.State.Content || '-').join(', '),
                    deleted: model.deleted.map(x => x.child.textContent || '-').join(', '),
                    added: model.added.map(x => x.item.State.Content || '-').join(', '),
                }
            })
        }
        return {ui, model};
    }


    private getKey(item: TItem | TElement) {
        if ('Path' in item) {
            return item.Path.join(Separator)
        }
        return item.id;
    }

    public set(id: string, item: TItem, element: TElement){
        this.cache.set(id, new ElementInfo<TItem, TElement>(
            id, element, item
        ));
    }

    remove(child: TElement) {
        this.cache.delete(child.id);
    }
}


export class ElementInfo<TItem extends {
    Index?: number;
    Path: string[];
    State?: {
        Content: string;
        UpdatedAt: DateTime;
    }
}, TElement extends {
    textContent: string;
    id?: string;
    nextSibling: TElement;
}> {
    constructor(public readonly id: string,
                public readonly element: TElement,
                public readonly item: TItem) {
    }


    public hasChanges(item: TItem) {
        return !this.item.State.UpdatedAt.equals(item.State.UpdatedAt) ||
            this.item.Index !== item.Index ||
            this.id !== item.Path.join(':') ||
            this.element.textContent !== item.State.Content;
    }
}

