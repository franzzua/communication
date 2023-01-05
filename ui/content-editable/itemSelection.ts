import {ItemElement} from "./content-editable.component";

export abstract class ItemSelection<T> {
    public Type: 'Caret' | 'Range';

    public static GetCurrent<T>(): ItemSelection<T> {
        const selection = window.getSelection();
        switch (selection?.type) {
            case  'Caret':
                const element = this.getSpan<T>(selection.anchorNode);
                if (!element.item)
                    return null;
                return new CaretSelection<T>(
                    element.item,
                    element.index,
                    selection.anchorOffset,
                );
            case  'Range':
                return new RangeSelection<T>(selection);
            default:
                return null;
        }
    }

    public Anchor: SelectionItem<T>;
    public Focus: SelectionItem<T>;
    public Direction: 'ltr' | 'rtl';


    protected static getSpan<T>(node: Node): {item: T, index: number} {
        if (node instanceof Text) {
            node = node.parentElement;
        }
        const element = (node as ItemElement<T>);
        return  {
            item: element.item,
            index: element.index
        }
    }

    public abstract GetItemSelection(item: T, index: number): { from?; to?; at?; } | null;

    static set<T>(node: HTMLElement) {
        const selection = window.getSelection();
        if (selection && !selection.containsNode(node, true)) {
            console.log('set selection', node);
            selection.setBaseAndExtent(node, 0, node, 0);
        }
        return this.GetCurrent<T>();
    }
}

export class CaretSelection<T> extends ItemSelection<T> {
    public Type: 'Caret' = 'Caret';

    constructor(item: T, index: number, offset: number) {
        super();
        this.Anchor = this.Focus = {item, index, offset};
        this.Direction = 'ltr';
    }

    GetItemSelection(item: T, index: number) {
        if (item === this.Focus?.item)
            return {at: this.Focus.offset};
        return null;
    }
}

export class RangeSelection<T> extends ItemSelection<T> {
    public Type: 'Range' = 'Range';

    constructor(selection: globalThis.Selection) {
        super();
        this.Anchor = {
            ...ItemSelection.getSpan(selection.anchorNode),
            offset: selection.anchorOffset,
        };
        this.Focus = {
            ...ItemSelection.getSpan(selection.focusNode),
            offset: selection.focusOffset,
        };
        this.Direction = (this.Anchor.index < this.Focus.index) ? 'ltr' : 'rtl';
    }

    GetItemSelection(item: T, index: number) {
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