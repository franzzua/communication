// @ts-ignore
window.global = self;
import { Request } from "@cmmn/infr";
import { TestApp } from "./test-app";

Request.fetch = fetch.bind(globalThis);
TestApp.Build().catch(console.log)
