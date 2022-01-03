// @ts-ignore
globalThis['window'] = globalThis;
import {WorkerEntry} from "@common/domain/worker";
import {WorkerContainer} from "./container";

const entry = WorkerContainer.get<WorkerEntry>(WorkerEntry);
