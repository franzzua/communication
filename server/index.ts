import express from "express";
import { podApp } from "./pod.app";
import {useSignalling} from "./webrtc";

const app = express();


app.use('/context', express.static(__dirname));
app.use('/context', function(req, res){
    res.sendFile(`${__dirname}/index.html`);
} );
app.use('/', podApp);
app.use('/.well-known', express.static('./well-known'));

const server = app.listen(3000)
useSignalling(server);
// const {Server} = require("pod-server");
//
// console.log('fuck.');