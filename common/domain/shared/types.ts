export enum WorkerMessageType {
    State = 0,
    Action = 1,
    Response = 2,
    Connected = 3,
    Subscribe = 4
}

export type WorkerResponse = {
    type: WorkerMessageType.Response;
    response?: any,
    error?: any,
    actionId: string;
};
export type ModelPath = {

    // Model name, unique
    model: string;
    // Model id, unique
    id: any;
    // Subpath of internal entity of model
    path: (string | number)[];
}
export type Action = ModelPath & {
    action: string;
    args: any[]
}
export type WorkerAction = {
    type: WorkerMessageType.Action;
    actionId: string;
} & Action;
export type WorkerSubscribe = {
    type: WorkerMessageType.Subscribe;
} & ModelPath;
export type WorkerState = {
    type: WorkerMessageType.State;
    state: any;
} & ModelPath;
export type WorkerConnected = {
    type: WorkerMessageType.Connected
};
export type WorkerMessage = WorkerState
    | WorkerAction
    | WorkerResponse
    | WorkerSubscribe
    | WorkerConnected;