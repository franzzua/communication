import {serialize, deserialize} from "@cmmn/core";

export function encode(data): Uint8Array {
    return serialize(data);
}

export function decode<T>(data: Uint8Array): T {
    return deserialize(data) as T;
}

