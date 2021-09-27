import {AccessRule, Message, Sorting, User} from "@model";
import {DateTime} from "luxon";

export class MessageJSON{
    public ContextURI: string;
    public SubContextURI?: string;
    public StorageURI: string;
    public id: string;
    public Content: string;
    public Description?: string;
    public AuthorURI?: string;
    public CreatedAt: string;
    public UpdatedAt: string;
    public Action?: string;
    public URI?: string;
    public Order: number;
}

export class ContextJSON {
    public URI?: string;
    public IsRoot?: boolean;
    public id?: string;
    // public Access?: Array<AccessRule> = [];
    // public Sorting?: string;
    public Permutation?: string;
    public CreatedAt: string;
    public UpdatedAt?: string;
    public StorageURI?: string;
    // public MessageURIs: string[];
    // public ParentsURIs: string[];
}

export class StorageJSON {
    public Type: string;
    public URI: string;
    public Contexts: ContextJSON[];
    public Messages: MessageJSON[];
}

