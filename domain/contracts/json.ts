import {AccessRule, Message, Sorting, User} from "@model";
import {DateTime} from "luxon";

export class MessageJSON{
    public ContextURI?: string;
    public SubContextURI?: string;
    public StorageURI?: string;

    public Content: string;
    public Description?: string;
    public AuthorURI?: string;
    public CreatedAt?: DateTime;
    public Action?: string;
    public URI?: string;
}

export class ContextJSON {
    public URI?: string;
    // public Access?: Array<AccessRule> = [];
    public Sorting?: Sorting;
    public Permutation?: any;
    public StorageURI?: string;
    public MessageURIs: string[];
    public ParentsURIs: string[];
}

export class StorageJSON {
    public Type: string;
    public URI: string;
    public Contexts: ContextJSON[];
    public Messages: MessageJSON[];
}
