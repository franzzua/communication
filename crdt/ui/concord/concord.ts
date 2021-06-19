// import {crdtlib} from "@concordant/c-crdtlib";

export namespace Concord{
    export interface VTime{

    }
    export interface RGAState{

    }

    export interface RGA {
        env: Environment;
        generateDelta(time: VTime): RGA;
        merge(delta: RGA);
        get(): RGAState;
        toJson(): string;
    }

    export interface Environment{
        getState(): VTime;
    }

    // @ts-ignore
    export const Environment: (uuid: string) => Environment = uuid => new crdtlib.utils.SimpleEnvironment(new crdtlib.utils.ClientUId(uuid))
    // @ts-ignore
    export const RGA: (env: Environment) => RGA = env => new crdtlib.crdt.DeltaCRDTFactory.Companion.createDeltaCRDT("RGA",env);
}
