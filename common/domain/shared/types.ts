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
export type ModelPath = (string | number)[];
export type Action = {
    path: ModelPath;
    action: string;
    args: any[]
}
export type WorkerAction = {
    type: WorkerMessageType.Action;
    actionId: string;
} & Action;
export type WorkerSubscribe = {
    path: ModelPath;
    type: WorkerMessageType.Subscribe;
};
export type WorkerState = {
    path: ModelPath;
    type: WorkerMessageType.State;
    state: any;
};
export type WorkerConnected = {
    type: WorkerMessageType.Connected;
    structure: ModelStructure;
};
export type ModelStructure = {

}
export type WorkerMessage = WorkerState
    | WorkerAction
    | WorkerResponse
    | WorkerSubscribe
    | WorkerConnected;
