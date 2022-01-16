import {registerSerializer} from "@cmmn/core";

export class Permutation {

    constructor(public values: ReadonlyArray<number>) {
    }

    public Apply(other: Permutation) {
        const values = new Array(this.values.length);
        for (let i = 0; i < this.values.length; i++) {
            values[i] = this.values[other.values[i]];
        }
        return new Permutation(values);
    }

    public ToArray() {
        return this.values;
    }

    public static I(size: number) {
        const arr = new Array(size);

        for (let i = 0; i < size; i++) {
            arr[i] = i;
        }
        return new Permutation(arr);
    }

    static Parse(ordering: string) {
        const arr = JSON.parse(ordering);
        return new Permutation(arr.distinct());
    }

    public toString() {
        return JSON.stringify(this.values);
    }

    public Invoke<T>(arr: ReadonlyArray<T>) {
        const result: T[] = new Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
            result[i] = arr[this.values[i] ?? i];
        }
        return result;
    }

    public static Empty = new Permutation([]);

    static Diff<T>(from: ReadonlyArray<T>, to: ReadonlyArray<T>) {
        const arr = new Array(to.length);
        for (let i = 0; i < to.length; i++) {
            arr[i] = from.indexOf(to[i]);
            if (arr[i] == -1) arr[i] = i;
        }
        return new Permutation(arr);
    }

    static FromShort(reordering: number[][]) {
        return undefined;
    }

    public isInvalid(): Boolean {
        if (!this.values.length)
            return false;
        return Math.max(...this.values) > this.values.length - 1 ||
            this.values.reduce((a, b) => a + b) !== this.values.length * (this.values.length - 1) / 2;
    }
}

registerSerializer<Permutation, ReadonlyArray<number>>(10, Permutation,
    perm => perm.ToArray(),
    array => new Permutation(array)
);
