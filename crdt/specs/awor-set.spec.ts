import {suite, expect, test} from "@hypertype/tools/test";
import {AworSet} from "../delta/awor-set";

@suite
export class AWORSetSpec{

    @test("should add, remove and re-add elements in the same replica")
    addRemoveThenAddTest() {
        const set = AworSet.Zero<number>()
            .with("A", 1)
            .with("A", 2)
            .without( 1)
            .with("A", 3)
            .with("A", 1)
            .without( 2)
        expect(set.values).deep.equal([1,3]);
    }

    @test("should prefer adds over rems in concurrent updates")
    addPrefer() {
        const init = AworSet.Zero<number>()
            .with("A", 1)
            .with("A", 2)
            .with("A", 3)
            .split().value;

        const a = init
            .with("A", 2)
            .without(3);

        const b = init
            .with('B', 3)
            .without(1)
            .without(2);

        const merged = a.merge(b);
        const merged2 = b.merge(a);

        expect(merged.values).deep.equal([2,3])
        expect(merged2.values).deep.equal([2,3])
    }

    @test("should merge delta")
    mergeDelta() {
        const init = AworSet.Zero<number>()
            .with("A", 1)
            .with("B", 2)
            .split().value;

        const a = init
            .without( 1)
            .without(2);

        const b = init
            .with('B', 1)
            .with('B', 3);


        const merged = a.mergeDelta(b.delta);
        const merged2 = b.mergeDelta(a.delta);

        expect(merged.values).deep.equal([1,3])
        expect(merged2.values).deep.equal([1,3])
    }

}
