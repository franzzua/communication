// @ts-ignore
window.global = self;
import { Request } from "@cmmn/infr";
import { App2 } from "../app/app2";

Request.fetch = fetch.bind(globalThis);
App2.Build()
