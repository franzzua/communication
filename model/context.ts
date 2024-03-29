import {Storage} from "./storage";
import {DateTime, utc} from "@cmmn/core";
import {ContextJSON} from "@domain";
import {Permutation} from "@domain/helpers/permutation";

export class Context {
    public readonly id: string;
    public URI: string;

    public Messages: Array<string> = [];
    public Parents: Array<string> = [];
    // public Access?: Array<AccessRule> = [];
    // public Sorting?: Sorting;
    public Permutation?: Permutation;
    public Storage: Omit<Storage, keyof { Root, Contexts, Messages }>;
    // public Parents: Array<string> = [];
    public IsRoot: boolean;
    public UpdatedAt: DateTime;
    public CreatedAt: DateTime;

    public equals?(m: Context): boolean;


    static FromJSON(c: ContextJSON): Context {
        const permutation = c.Permutation ? Permutation.Parse(c.Permutation) : null;
        return Object.assign(new Context(), {
            URI: c.URI,
            id: c.id,
            Storage: null,
            Parents: [],
            IsRoot: c.IsRoot,
            UpdatedAt: utc(c.UpdatedAt),
            CreatedAt: utc(c.CreatedAt),
            Permutation: permutation,
            Messages: [],
        });
    }

    static ToJSON(c: Context): ContextJSON {
        return {
            // StorageURI: c.Storage.URI,
            URI: c.URI,
            id: c.id,
            UpdatedAt: c.UpdatedAt.toJSON(),
            CreatedAt: c.CreatedAt?.toJSON(),
            IsRoot: c.IsRoot,
            // Sorting: Sorting[c.],
            Permutation: c.Permutation?.toString(),
            // MessageURIs: c.Messages,
            // ParentsURIs: c.Parents
        };
    }

    static equals(x: Context, y: Context): boolean {
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
