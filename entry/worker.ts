// @ts-ignore
globalThis['window'] = globalThis;
import {WorkerEntry} from "@cmmn/domain/worker";
import {WorkerContainer} from "./container";

const entry = WorkerContainer.get<WorkerEntry>(WorkerEntry);
