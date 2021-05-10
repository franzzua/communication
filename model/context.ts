import {Message} from "./message";
import {Storage} from "./storage";
import { DateTime } from "@hypertype/core";
import {ContextJSON} from "@domain";
import { utc } from "@hypertype/core";

export class Context {
    public readonly id: string;
    public URI: string;
    public Messages: Array<Message> = [];
    // public Access?: Array<AccessRule> = [];
    // public Sorting?: Sorting;
    // public Permutation?: Permutation;
    public readonly Storage: Storage;
    public Parents: Array<Message> = [];
    public IsRoot: boolean;
    public UpdatedAt: DateTime;
    public CreatedAt: DateTime;


    static FromJSON(c: ContextJSON): Pick<Context, "URI" | "id" | "IsRoot" | "UpdatedAt" | "CreatedAt"> {
        return  {
            URI: c.URI,
            id: c.id,
            IsRoot: c.IsRoot,
            UpdatedAt: utc(c.UpdatedAt),
            CreatedAt: utc(c.CreatedAt),
        };
    }

    static ToJSON(c: Context): ContextJSON {
        return {
            StorageURI: c.Storage.URI,
            URI: c.URI,
            id: c.id,
            UpdatedAt: c.UpdatedAt.set({millisecond: 0}).toISO(),
            CreatedAt: c.CreatedAt.set({millisecond: 0}).toISO(),
            IsRoot: c.IsRoot,
            // Sorting: Sorting[c.],
            // Permutation: c.Permutation?.toString(),
            // MessageURIs: c.Messages.map(m => m.URI),
            // ParentsURIs: c.Parents.map(m => m.URI)
        };
    }

}

