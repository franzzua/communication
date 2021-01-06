import {Message} from "./message";
import {Sorting} from "./sorting";
import {AccessRule} from "./accessRule";
import {Storage} from "./storage";

export class Context {
    public URI?: string;
    public readonly Messages: Array<Message> = [];
    public readonly Access?: Array<AccessRule> = [];
    public Sorting?: Sorting;
    public Permutation?: any;
    public Storage?: Storage;
}

