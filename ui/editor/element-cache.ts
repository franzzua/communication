import {Diff} from "./diff-apply";
import {ElementBind} from "./element-bind";
import {EditorItem} from "./types";

const Separator = ':';

export class ElementCache {
    private cache = new Map<string, ElementBind>();
    private uriCache = new Map<string, Set<ElementBind>>();
    private nodeCache = new Map<Element, ElementBind>();

    private getKey(item: EditorItem | Element) {
        if ('Path' in item) {
            return item.Path.join(Separator)
        }
        return item.id;
    }
    public get(item: EditorItem | Element): ElementBind {
        if (!item)
            return undefined;
        return this.cache.get(this.getKey(item));
    }

    getMergeDiff(items: Iterable<EditorItem>, firstChild: Element, fromUI: boolean) {
        const ui = new Diff();
        const model = new Diff();

        const checked = new Set<Element>();
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
            checked.add(currentChild.element);
            if (!currentChild.hasChanges(item)) {
                continue;
            }
            if (fromUI) {
                ui.updated.push({child: currentChild.element, item});
            } else {
                model.updated.push({child: currentChild.element, item});
            }
        }

        for (let current = firstChild; current != undefined; current = current.nextElementSibling as Element) {
            if (checked.has(current))
                continue;
            const element = this.nodeCache.get(current)
            if (element) {
                //model deleted
                model.deleted.push({child: current, item: element.item});
            } else {
                ui.added.push({child: current});
            }
        }

        if (model.added.length > 0 && model.deleted.length > 0) {
            // match by index
            for (let added of model.added.slice()) {
                const deleted = model.deleted.find(x => x.item.Index == added.item.Index);
                if (deleted) {
                    model.added.remove(added);
                    model.deleted.remove(deleted);
                    model.updated.push({child: deleted.child, item: added.item});
                }
            }
            // match by content
            for (let added of model.added.slice()) {
                const deleted = model.deleted.find(x => x.item.Message.State.Content == added.item.Message.State.Content);
                if (deleted) {
                    model.added.remove(added);
                    model.deleted.remove(deleted);
                    model.updated.push({child: deleted.child, item: added.item});
                }
            }
            // match by default
            const minLength = Math.min(model.added.length, model.deleted.length);
            for (let i = 0; i < minLength; i++){
                let added = model.added[i];
                let deleted = model.deleted[i];
                model.updated.push({child: deleted.child, item: added.item});
            }
            model.added.splice(0, minLength);
            model.deleted.splice(0, minLength);
        }

        // console.table(state);
        if (!ui.isEmpty() || !model.isEmpty()) {
            console.table({
                ui: {
                    updated: ui.updated.map(x => x.child.textContent || '-').join(', '),
                    deleted: ui.deleted.map(x => x.item.Message.State.Content || '-').join(', '),
                    added: ui.added.map(x => x.child.textContent || '-').join(', '),
                },
                model: {
                    updated: model.updated.map(x => x.item.Message.State.Content || '-').join(', '),
                    deleted: model.deleted.map(x => x.child.textContent || '-').join(', '),
                    added: model.added.map(x => x.item.Message.State.Content || '-').join(', '),
                }
            })
        }
        return {ui, model};
    }


    public set(id: string, item: EditorItem, element: Element){
        const existed = this.cache.get(id);
        if (existed) {
            existed.update(item, element);
            return;
        }
        const info = new ElementBind(
            id, element, item
        );
        this.cache.set(id, info);
        this.nodeCache.set(element, info);
        const uri = item.Message.State.SubContextURI;
        this.uriCache.getOrAdd(uri, () => new Set()).add(info);
    }

    remove(child: Element) {
        this.cache.delete(child.id);
        const element = this.nodeCache.get(child);
        this.nodeCache.delete(child);
        const uri = element.item.Message.State.SubContextURI;
        element.dispose();
        this.uriCache.get(uri)?.delete(element);
    }

    find(uri: string) {
        return this.uriCache.get(uri);
    }
}


