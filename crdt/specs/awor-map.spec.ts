import {suite, expect, test} from "@hypertype/tools/test";
import {AworMap} from "../delta/awor-map";

@suite
export class AWORMapSpec{

    @test("should add, remove and re-add elements in the same replica")
    addRemoveThenAddTest() {
        const map = AworMap.Zero<string, number>()
            .with("A", "key1", 1)
            .with("A", "key2", 2)
            .with("A", "key3", 3)
            .without( "key1",)
            .with("A", "key1", 4)
            .without( "key3",)
            .with("A", "key2", 5);
        expect(map.values.orderBy(x => x[0])).deep.equal([["key1",4],["key2",5]]);
    }
    @test("simple merge")
    simpleMerge(){
        const a  = AworMap.Zero<number, number>().with("A", 1, 1);
        const b  = AworMap.Zero<number, number>().with("B", 2, 2);
        expect(a.merge(b).values.orderBy(x => x[0])).deep.equal([[1,1], [2,2]]);
    }


    @test("should prefer add before merge in concurrent updates")
    merge() {
        const init = AworMap.Zero<string, number>()
            .with("A", "key1", 1)
            .with("A", "key2", 2)
            .with("A", "key3", 3)
            .split().value;

        const a = init
            .with("A", "key4", 4)
            .with("A", "key1", 5)
            .without( "key3");

        const b = init
            .with("B", "key1", 2)
            .with("B", "key3", 6)
            .without( "key2");

        const ab = a.merge(b);
        const ba = a.merge(b);
        const adb = a.mergeDelta(b.delta);
        const bda = b.mergeDelta(a.delta);

        const expected = [
            ["key1", 5],
            ["key3", 6],
            ["key4", 4],
        ];

        expect(ab.values.orderBy(x => x[0]), "ab").deep.equal(expected);
        expect(ba.values.orderBy(x => x[0]), "ba").deep.equal(expected);
        expect(adb.values.orderBy(x => x[0]), "adb").deep.equal(expected);
        expect(bda.values.orderBy(x => x[0]), "bda").deep.equal(expected);
    }

    @test("should merge inner structures")
    mergeMergebles() {
        const a = AworMap.Zero<string, AworMap<string, number>>()
            .with("A", "key1",
                AworMap.Zero<string, number>().with("A", "key1", 3)
            )
        const b = AworMap.Zero<string, AworMap<string, number>>()
            .with("B", "key1",
                AworMap.Zero<string, number>().with("B", "key2", 4)
            )
        const expected = [
            ["key1", 3],
            ["key2", 4],
        ];
        const ab = a.merge(b);
        const mergedMap = ab.values[0][1] as AworMap<string, number>;
        expect([...mergedMap.values].orderBy(x => x[0]), "bda").deep.equal(expected);
    }
}
