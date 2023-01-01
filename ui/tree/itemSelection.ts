export abstract class ItemSelection<T> {
    public Type: 'Caret' | 'Range';

    public static GetCurrent<T>(): ItemSelection<T> {
        const selection = window.getSelection();
        switch (selection.type) {
            case  'Caret':
                return new CaretSelection<T>(
                    this.getSpan(selection.anchorNode),
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

    protected static getSpan<T>(node: Node) {
        if (node instanceof Text) {
            node = node.parentElement;
        }
        return node as HTMLSpanElement & { item: T, index: number };
    }

    public abstract GetItemSelection(item: T, index: number): { from?; to?; at?; } | null;
}

export class CaretSelection<T> extends ItemSelection<T> {
    public Type: 'Caret' = 'Caret';

    constructor(node: HTMLSpanElement & { item: T, index: number }, offset: number) {
        super();
        this.Anchor = this.Focus = { node, offset };
        this.Direction = 'ltr';
    }

    GetItemSelection(item: T, index: number) {
        if (item === this.Focus?.node.item)
            return { at: this.Focus.offset };
        return null;
    }
}

export class RangeSelection<T> extends ItemSelection<T> {
    public Type: 'Range' = 'Range';

    constructor(selection: globalThis.Selection) {
        super();
        this.Anchor = {
            node: ItemSelection.getSpan(selection.anchorNode),
            offset: selection.anchorOffset,
        };
        this.Focus = {
            node: ItemSelection.getSpan(selection.focusNode),
            offset: selection.focusOffset,
        };
        this.Direction = (this.Anchor.node.index < this.Focus.node.index) ? 'ltr' : 'rtl';
    }

    GetItemSelection(item: T, index: number) {
        if (this.Direction == 'ltr') {
            if (this.Anchor.node.index == index) {
                return { from: this.Anchor.offset };
            }
            if (this.Anchor.node.index < index && index < this.Focus.node.index) {
                return { from: 0 };
            }
            if (index == this.Focus.node.index) {
                return { from: 0, to: this.Focus.offset };
            }
        } else if (this.Direction == 'rtl') {
            if (this.Focus.node.index == index) {
                return { from: this.Focus.offset };
            }
            if (this.Focus.node.index < index && index < this.Anchor.node.index) {
                return { from: 0 };
            }
            if (index == this.Anchor.node.index) {
                return { from: 0, to: this.Anchor.offset };
            }
        }
    }
}

export type SelectionItem<T> = {
    offset: number;
    node: HTMLSpanElement & { item: T, index: number };
}