import {suite, test} from "@testdeck/jest";
import {WebsocketMock} from "./websocket.mock";
import {YjsWebrtcController} from "../server/yjs-webrtc-controller.service";
import {TokenParser} from "../../server/services/token.parser";
import {CryptoKeyStorageMock} from "../../specs/crypto-key-storage-mock";
import {SignalingConnection} from "../client/signaling-connection";
import {AccessMode} from "@inhauth/core";
import {expect} from "@jest/globals";

@suite
export class RegisterSpec {

    private parser = new TokenParser(new CryptoKeyStorageMock());
    private serverController = new YjsWebrtcController(this.parser);
    private room = 'room';

    @test
    public async testConnection() {
        const {client, announces} = await this.getClient({
            User: 'user A',
            AccessMode: AccessMode.write
        });
        await new Promise(resolve => setTimeout(resolve, 300));
        expect(announces[0].room).toBe(this.room);
        expect(announces[0].users).toHaveLength(0);
    }

    @test
    public async testClient2() {
        const {client: clientA, announces: announcesA} = await this.getClient({
            User: 'user A',
            AccessMode: AccessMode.write
        });
        const  {client: clientB, announces: announcesB}  = await this.getClient({
            User: 'user B',
            AccessMode: AccessMode.read
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(announcesA[0].users).toHaveLength(0);
        expect(announcesB[0].users).toHaveLength(1);
        expect(announcesA[1].users).toHaveLength(1);
        expect(announcesA[1].users[0].user).toBe('user B');
        expect(announcesA[1].users[0].accessMode).toBe('read');
        expect(announcesB[0].users[0].user).toBe('user A');
        expect(announcesB[0].users[0].accessMode).toBe('write');
        const  {client: clientC, announces: announcesC}  = await this.getClient({
            User: 'user C',
            AccessMode: AccessMode.write
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(announcesC[0].users).toHaveLength(2);
    }

    private async getClient(token) {
        const {client, server} = WebsocketMock.createPair();
        const client1 = new SignalingConnection(client as any);
        client1.register({
            room: this.room,
            token: await this.parser.stringify(token)
        });
        this.serverController.handleConnection(server as any);
        const announces = [];
        client1.on('announce', (room, users) => announces.push({room, users}));
        return {client: client1, announces};
    }

}