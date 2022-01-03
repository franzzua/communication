import {Message} from "./message";
import {Storage} from "./storage";
import { DateTime } from "luxon";
import {ContextJSON} from "@domain";
import { Permutation } from "@domain/helpers/permutation";

export class Context {
    public readonly id: string;
    public URI: string;
    public Messages: Array<Message> = [];
    // public Access?: Array<AccessRule> = [];
    // public Sorting?: Sorting;
    public Permutation?: Permutation;
    public Storage: Omit<Storage, keyof {Root, Contexts, Messages}>;
    public Parents: Array<Message> = [];
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
            // MessageURIs: c.Messages.map(m => m.URI),
            // ParentsURIs: c.Parents.map(m => m.URI)
        };
    }

    static equals(context: Context): (context1: Context) => boolean;
    static equals(context: Context, context1: Context): boolean;
    static equals(...contexts: Context[]) {
        if (contexts.length == 1) {
            return (context2: Context) => {
                if (context2.URI && context2.URI !== contexts[0].URI)
                    return false;
                if (contexts[0].id && contexts[0].id !== context2.id)
                    return false;
                return context2.UpdatedAt.equals(contexts[0].UpdatedAt);
            }
        } else {
            return Context.equals(contexts[0])(contexts[1]);
        }
    }

}

