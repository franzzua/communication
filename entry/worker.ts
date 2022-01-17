// @ts-ignore
globalThis['window'] = globalThis;
import {WorkerEntry} from "@cmmn/domain";
import {WorkerContainer} from "./container";

const entry = WorkerContainer.get<WorkerEntry>(WorkerEntry);
