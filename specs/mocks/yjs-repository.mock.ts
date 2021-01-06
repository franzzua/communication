import {delayAsync, Injectable} from "@hypertype/core";
import {YjsRepository} from "@infr/rtc/yjsRepository";
import {applyUpdate, Doc, encodeStateAsUpdate} from "yjs";
import {EventBus, StateService} from "@services";
import {LogService} from "../../services/log.service";
import {publicAccess} from "rdf-namespaces/dist/schema";

let instanceCounter = 0;

@Injectable()
export class YjsRepositoryMock extends YjsRepository {

    public static roomMap = new Map<string, Doc[]>();
    private instance: number = instanceCounter++;

    constructor(eventBus: EventBus, logService: LogService, stateService: StateService) {
        super(eventBus, logService, stateService);
    }

    protected async Connect(room: string, doc: Doc) {
        await delayAsync(10);

        doc.on('update', async update => {
            const otherDocs = YjsRepositoryMock.roomMap.get(room);
            for (const otherDoc of otherDocs) {
                if (otherDoc == doc)
                    continue;

                await delayAsync(10);
                applyUpdate(otherDoc, update, doc.clientID);
                this.logService.Info({Domain: 'yjs-mock', Phase: `update ${otherDoc.clientID} from ${doc.clientID}`});
            }
        });


        if (YjsRepositoryMock.roomMap.has(room)) {
            const otherDocs = YjsRepositoryMock.roomMap.get(room);
            for (const otherDoc of otherDocs) {
                const s1 = encodeStateAsUpdate(doc);
                const s2 = encodeStateAsUpdate(otherDoc);
                applyUpdate(doc, s2, otherDoc.clientID);
                applyUpdate(otherDoc, s1, doc.clientID);
            }

            YjsRepositoryMock.roomMap.get(room).push(doc);
        } else {
            YjsRepositoryMock.roomMap.set(room, [doc]);
        }
        // const provider = new WebrtcProvider(room, doc, {
        //     signaling: [
        //         'ws://localhost:4444'
        //     ]
        // } as any);


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