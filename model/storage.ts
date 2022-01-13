import {Context} from "./context";
import {Message} from "./message";
import {proxy} from "@common/domain";
import {dom} from "lib0";

export class Storage {
    public Root: Context;
    public Type: string;
    public URI: string;
    public Trash: Context[];
    public Contexts: Map<string, Context>;
    public Messages: Map<string, Message>;
    public equals?: (s: Storage) => boolean;
}

export class DomainState {
    public Contexts: string[];
}
