import {Context} from "./context";
import {Message} from "./message";

export class Storage {
    public Root: Context;
    public Type: string;
    public URI: string;
    public Trash: Context[];
    public Contexts: Map<string, Context>;
    public Messages: Map<string, Message>;
}

export class DomainState {
    public Storages: Storage[];
}
