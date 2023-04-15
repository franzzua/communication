import {UserInfo} from "./token-parser";
import {PeerConnection} from "./peer-connection";

export abstract class ConnectionProvider{

    abstract connectTo(user: UserInfo, roomName: string, toUser: string): Promise<PeerConnection>;
}