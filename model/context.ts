import {Message} from "./message";
import {Sorting} from "./sorting";
import {AccessRule} from "./accessRule";
import {Communication} from "./communication";

export class Context {
    public URI: string;
    public readonly Messages: Array<Message> = [];
    public readonly Access?: Array<AccessRule> = [];
    public Sorting?: Sorting;
    public Permutation?: any;
    public Communication?: Communication;
}

