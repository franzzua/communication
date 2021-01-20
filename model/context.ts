import {Message} from "./message";
import {Sorting} from "./sorting";
import {AccessRule} from "./accessRule";
import {Storage} from "./storage";

export class Context {
    public id?: string;
    public URI?: string;
    public Messages: Array<Message> = [];
    public Access?: Array<AccessRule> = [];
    public Sorting?: Sorting;
    public Permutation?: any;
    public Storage?: Storage;
}

