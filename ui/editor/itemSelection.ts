import {ElementCache, ElementInfo} from "./element-cache";
import {EditorItem} from "./types";

export abstract class ItemSelection {
    public Type: 'Caret' | 'Range';

    public static GetCurrent(cache: ElementCache<EditorItem, Node>): ItemSelection {
        const selection = window.getSelection();
        switch (selection?.type) {
            case  'Caret':
                const element = this.getSpan<EditorItem>(selection.anchorNode);
                const cached = cache.get(element);
                if (!cached)
                    return null;
                return new CaretSelection(
                    cached,
                    cached.item.Index,
                    selection.anchorOffset,
                );
            case  'Range':
                return new RangeSelection(selection);
            default:
                return null;
        }
    }

    public Anchor: SelectionItem<ElementInfo<EditorItem, Node>>;
    public Focus: SelectionItem<ElementInfo<EditorItem, Node>>;
    public Direction: 'ltr' | 'rtl';


    protected static getSpan<T>(node: Node): Node {
        if (node instanceof Text) {
            node = node.parentElement;
        }
        return node;
    }

    public abstract GetItemSelection(item: ElementInfo<EditorItem, Node>, index: number): { from?; to?; at?; } | null;

    static set(node: HTMLElement) {
        const selection = window.getSelection();
        if (selection && !selection.containsNode(node, true)) {
            console.log('set selection', node);
            selection.setBaseAndExtent(node, 0, node, 0);
        }
    }

    public Update(elementCache: ElementCache<EditorItem, Node>) {
        this.Focus.item = elementCache.get(this.Focus.item.item);
        this.Anchor.item = elementCache.get(this.Anchor.item.item);
        window.getSelection().setBaseAndExtent(
            this.Focus.item.element, this.Focus.offset,
            this.Anchor.item.element, this.Anchor.offset,
        );
        return this;
    }
}

export class CaretSelection extends ItemSelection {
    public Type: 'Caret' = 'Caret';

    constructor(item: ElementInfo<EditorItem, Node>, index: number, offset: number) {
        super();
        this.Anchor = this.Focus = {item, index, offset};
        this.Direction = 'ltr';
    }

    GetItemSelection(item: ElementInfo<EditorItem, Node>, index: number) {
        if (item === this.Focus?.item)
            return {at: this.Focus.offset};
        return null;
    }
}

export class RangeSelection extends ItemSelection {
    public Type: 'Range' = 'Range';

    constructor(selection: globalThis.Selection) {
        super();
        // this.Anchor = {
        //     ...ItemSelection.getSpan(selection.anchorNode),
        //     offset: selection.anchorOffset,
        // };
        // this.Focus = {
        //     ...ItemSelection.getSpan(selection.focusNode),
        //     offset: selection.focusOffset,
        // };
        this.Direction = (this.Anchor.index < this.Focus.index) ? 'ltr' : 'rtl';
    }

    GetItemSelection(item: ElementInfo<EditorItem, Node>, index: number) {
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

export type SelectionItem<T> = {
    offset: number;
    item: T;
    index: number;
    // node: ExtendedElement<ContentItemComponent<T>>;
}