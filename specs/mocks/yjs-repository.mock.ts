import {delayAsync, Injectable} from "@hypertype/core";
import {applyUpdate, Doc, encodeStateAsUpdate} from "yjs";
import {EventBus, StateService} from "@services";
import {LogService} from "../../services/log.service";
import {publicAccess} from "rdf-namespaces/dist/schema";
import {YjsConnector} from "@infr/rtc";

let instanceCounter = 0;

@Injectable()
export class YjsConnectorMock  extends YjsConnector{

    public static roomMap = new Map<string, Doc[]>();
    private instance: number = instanceCounter++;

    constructor() {
        super();
    }

    public async Connect(room: string, doc: Doc) {
        await delayAsync(10);

        doc.on('update', async update => {
            const otherDocs = YjsConnectorMock.roomMap.get(room);
            for (const otherDoc of otherDocs) {
                if (otherDoc == doc)
                    continue;

                await delayAsync(10);
                applyUpdate(otherDoc, update, doc.clientID);
                // this.logService.Info({Domain: 'yjs-mock', Phase: `update ${otherDoc.clientID} from ${doc.clientID}`});
            }
        });


        if (YjsConnectorMock.roomMap.has(room)) {
            const otherDocs = YjsConnectorMock.roomMap.get(room);
            for (const otherDoc of otherDocs) {
                const s1 = encodeStateAsUpdate(doc);
                const s2 = encodeStateAsUpdate(otherDoc);
                applyUpdate(doc, s2, otherDoc.clientID);
                applyUpdate(otherDoc, s1, doc.clientID);
            }

            YjsConnectorMock.roomMap.get(room).push(doc);
        } else {
            YjsConnectorMock.roomMap.set(room, [doc]);
        }

    }

    static Clear(){
        for (let [room, docs] of this.roomMap){
            for(let doc of docs){
                doc.destroy();
            }
        }
        this.roomMap = new Map<string, Doc[]>();
    }
}