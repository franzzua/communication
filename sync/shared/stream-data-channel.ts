import {MessageType, PeerConnection} from "./peer-connection";
import {UserInfo} from "./token-parser";

export class StreamDataChannel extends PeerConnection {

    public constructor(private readStream: ReadableStream,
                       private writeStream: WritableStream,
                       user: UserInfo,
                       incoming: boolean) {
        super(user, incoming);
        // console.log('connected', user.user, user.accessMode, dataChannel.label);
        let type: MessageType = null;
        this.readStream.pipeTo(new WritableStream<ArrayBuffer>({
            write: chunk => {
                const data: Uint8Array = new Uint8Array(chunk);
                if (type == null)
                    type = data[0];
                else {
                    this.emit(type, new Uint8Array(data));
                    type = null;
                }
            },
            close: ()=>{
                this.dispose();
            }
        }))

    }
    public async send(type: MessageType, data: Uint8Array){
        const writer = this.writeStream.getWriter();
        await writer.write(Uint8Array.of(type));
        await writer.write(data);
    }

}
