import { DateTime } from "@hypertype/core";
import {Context} from "./context";
import {Message} from "./message";

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
    public Storages: Storage[];
}
