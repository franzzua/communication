import {Message} from "./message";
import {Sorting} from "./sorting";
import {AccessRule} from "./accessRule";
import {Storage} from "./storage";
import {ModelProxy} from "@hypertype/domain";
import { Permutation } from "@domain/helpers/permutation";

export class Context {
    public id: string;
    public URI: string;
    public Messages?: Array<Message> = [];
    public Access?: Array<AccessRule> = [];
    public Sorting?: Sorting;
    public Permutation?: Permutation;
    public Storage?: Storage;
    public Parents?: Array<Message> = [];
    public IsRoot?: boolean;
}

