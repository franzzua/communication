// @ts-ignore
window.global = self;
// @ts-ignore
// Object.assign(crypto, require('crypto-browserify'));


import {fromEvent, takeUntil } from "@hypertype/core";
import { App2 } from "../app/app2";
import {Application} from "../app/application";

const app = App2.Build();
// @ts-ignore
window.app = app;
// app.Init();

//
// const {unsubscribe} = app.Actions$.pipe(
//     takeUntil(fromEvent(window, 'beforeunload'))
// ).subscribe();
//
// window.addEventListener('beforeunload', ()=>{
//    unsubscribe();
// });
