import {Context} from "./context";
import {Message} from "./message";
import type {ConnectionState} from "@cmmn/sync/webrtc/client";

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
    public Selection: SelectionState;
    public Servers: Record<string, ConnectionState>;
    public Networks: ReadonlyMap<string, ReadonlyMap<string, {
        username: string;
        connected: boolean;
        direction: 'in' | 'out' | 'none';
    }>>
}

export class SelectionState {
    public Focus?: {Message; Offset};
    public Anchor?: {Message; Offset};
}
