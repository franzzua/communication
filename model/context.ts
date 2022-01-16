import {Message} from "./message";
import {Storage} from "./storage";
import { DateTime } from "luxon";
import {ContextJSON} from "@domain";
import { Permutation } from "@domain/helpers/permutation";
import {proxy} from "@cmmn/domain";

export class Context {
    public readonly id: string;
    public URI: string;

    public Messages: Array<string> = [];
    // public Access?: Array<AccessRule> = [];
    // public Sorting?: Sorting;
    public Permutation?: Permutation;
    public Storage: Omit<Storage, keyof {Root, Contexts, Messages}>;
    // public Parents: Array<string> = [];
    public IsRoot: boolean;
    public UpdatedAt: DateTime;
    public CreatedAt: DateTime;
    public equals?(m: Context): boolean;


    static FromJSON(c: ContextJSON): Context{
        return  Object.assign(new Context(), {
            URI: c.URI,
            id: c.id,
            Storage: null,
            Parents: [],
            IsRoot: c.IsRoot,
            UpdatedAt: DateTime.fromISO(c.UpdatedAt, {zone: 'utc'}),
            CreatedAt: DateTime.fromISO(c.CreatedAt, {zone: 'utc'}),
            Permutation: c.Permutation ? Permutation.Parse(c.Permutation) : null,
            Messages: [],
        });
    }

    static ToJSON(c: Context): ContextJSON {
        return {
            // StorageURI: c.Storage.URI,
            URI: c.URI,
            id: c.id,
            UpdatedAt: c.UpdatedAt.toISO(),
            CreatedAt: c.CreatedAt.toISO(),
            IsRoot: c.IsRoot,
            // Sorting: Sorting[c.],
            Permutation: c.Permutation?.toString(),
            // MessageURIs: c.Messages,
            // ParentsURIs: c.Parents
        };
    }

    static equals(x: Context, y: Context): boolean{
        if (x == null && y == null)
            return true;
        if (!x && y || !y && x)
            return false;
        if (y.URI && y.URI !== x.URI)
            return false;
        if (x.id && x.id !== y.id)
            return false;
        return y.UpdatedAt.equals(x.UpdatedAt);
    }

}
