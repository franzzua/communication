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
        return new Permutation(arr);
    }
    public toString(){
        return JSON.stringify(this.values);
    }

    public Invoke<T>(arr: T[]){
        const result: T[] = new Array(arr.length);
        for (let i = 0; i < arr.length; i++){
            result[i] = arr[this.values[i] ?? i];
        }
        return result;
    }

    public static Empty = new Permutation([]);

    static Diff<T>(from: ReadonlyArray<T>, to: ReadonlyArray<T>) {
        const arr = new Array(to.length);
        for (let i = 0; i < to.length; i++){
            arr[i] = from.indexOf(to[i]);
            if (arr[i] == -1) arr[i] = i;
        }
        return new Permutation(arr);
    }

    static FromShort(reordering: number[][]) {
        return undefined;
    }
}
