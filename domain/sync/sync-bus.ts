import {applyUpdate, Doc, encodeStateAsUpdate} from "yjs";
import {delayAsync} from "@hypertype/core";

export class SyncBus{

    private rooms = new Map<string, Doc[]>();

    public isUpdating$ = Promise.resolve();

    public connect(room: string, doc: Doc) {
        doc.on('update', async (update,x) => {
            return this.isUpdating$ = (async () => {
                const otherDocs = this.rooms.get(room);
                for (const otherDoc of otherDocs) {
                    if (otherDoc == doc)
                        continue;

                    await delayAsync(10);
                    applyUpdate(otherDoc, update, doc.clientID);
                    // this.logService.Info({Domain: 'yjs-mock', Phase: `update ${otherDoc.clientID} from ${doc.clientID}`});
                }
            })();
        });
        if (!this.rooms.has(room)){
            this.rooms.set(room, [doc]);
        } else {
            const otherDocs = this.rooms.get(room);
            for (const otherDoc of otherDocs) {
                const s1 = encodeStateAsUpdate(doc);
                const s2 = encodeStateAsUpdate(otherDoc);
                applyUpdate(doc, s2, otherDoc.clientID);
                applyUpdate(otherDoc, s1, doc.clientID);
            }
            this.rooms.get(room).push(doc);
        }
    }
}
