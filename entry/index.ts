// @ts-ignore
window.global = self;
// @ts-ignore
Object.assign(crypto, require('crypto-browserify'));


import {fromEvent, takeUntil } from "@hypertype/core";
import {Application} from "../app/application";

const app = Application.Build();
// @ts-ignore
window.app = app;
app.Init();

const {unsubscribe} = app.Actions$.pipe(
    takeUntil(fromEvent(window, 'beforeunload'))
).subscribe();

window.addEventListener('beforeunload', ()=>{
   unsubscribe();
});
