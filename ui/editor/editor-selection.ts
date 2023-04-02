import {ElementCache} from "./element-cache";
import {EditorItem} from "./types";
import {ElementBind} from "./element-bind";

export abstract class EditorSelection {
    public Type: 'Caret' | 'Range';

    public static GetCurrent(cache: ElementCache): EditorSelection {
        function getSpan(node: Node, offset: number): SelectionItem<ElementBind>{
            if (node instanceof Text) {
                node = node.parentElement;
            }
            const item = cache.get(node as Element);
            if (!item)
                return null;
            return {
                index: item.item.Index,
                item: item,
                offset: offset
            }
        }
        const selection = window.getSelection();
        switch (selection?.type) {
            case  'Caret':
                const item = getSpan(selection.anchorNode as Node, selection.anchorOffset);
                if (!item)
                    return null;
                return new CaretSelection(item);
            case  'Range':
                const anchor = getSpan(selection.anchorNode as Node, selection.anchorOffset);
                const focus = getSpan(selection.focusNode as Node, selection.focusOffset);
                if (!anchor || !focus)
                    return null;
                return new RangeSelection(anchor, focus);
            default:
                return null;
        }
    }
    protected static getSpan<T>(node: Node): Element {
        if (node instanceof Text) {
            node = node.parentElement;
        }
        return node as Element;
    }


    public Anchor: SelectionItem<ElementBind>;
    public Focus: SelectionItem<ElementBind>;
    public Direction: 'ltr' | 'rtl';


    public abstract GetItemSelection(item: ElementBind, index: number): { from?; to?; at?; } | null;

    static set(node: HTMLElement) {
        const selection = window.getSelection();
        if (selection && !selection.containsNode(node, true)) {
            console.log('set selection', node);
            selection.setBaseAndExtent(node, 0, node, 0);
        }
    }

    public Update(elementCache: ElementCache) {
        if (!this.Focus.item || !this.Anchor.item)
            return null;
        this.Focus.item = elementCache.get(this.Focus.item.element);
        this.Anchor.item = elementCache.get(this.Anchor.item.element);
        if (!this.Focus.item || !this.Anchor.item)
            return  null;
        window.getSelection().setBaseAndExtent(
            this.Focus.item.element, this.Focus.offset,
            this.Anchor.item.element, this.Anchor.offset,
        );
        return this;
    }
}

export class CaretSelection extends EditorSelection {
    public Type: 'Caret' = 'Caret';

    constructor(item: SelectionItem<ElementBind>) {
        super();
        this.Anchor = {...item};
        this.Focus = {...item};
        this.Direction = 'ltr';
    }

    GetItemSelection(item: ElementBind, index: number) {
        if (item === this.Focus?.item)
            return {at: this.Focus.offset};
        return null;
    }
}

export class RangeSelection extends EditorSelection {
    public Type: 'Range' = 'Range';

    constructor(anchor: SelectionItem, focus: SelectionItem) {
        super();
        this.Anchor = anchor;
        this.Focus = focus;
        this.Direction = (this.Anchor.index < this.Focus.index) ? 'ltr' : 'rtl';
    }

    GetItemSelection(item: ElementBind, index: number) {
        if (this.Direction == 'ltr') {
            if (this.Anchor.index == index) {
                return {from: this.Anchor.offset};
            }
            if (this.Anchor.index < index && index < this.Focus.index) {
                return {from: 0};
            }
            if (index == this.Focus.index) {
                return {from: 0, to: this.Focus.offset};
            }
        } else if (this.Direction == 'rtl') {
            if (this.Focus.index == index) {
                return {from: this.Focus.offset};
            }
            if (this.Focus.index < index && index < this.Anchor.index) {
                return {from: 0};
            }
            if (index == this.Anchor.index) {
                return {from: 0, to: this.Anchor.offset};
            }
        }
    }
}

export type SelectionItem<T = ElementBind> = {
    offset: number;
    item: T;
    index: number;
    // node: ExtendedElement<ContentItemComponent<T>>;
}