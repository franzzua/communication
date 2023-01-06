import {suite, test} from "@testdeck/jest";
import {expect} from "@jest/globals";
import {WebsocketMock} from "../websocket.mock";
import {YjsWebrtcController} from "../../yjsWebRTC/server/yjs-webrtc-controller.service";
import {TokenParser} from "../../server/services/token.parser";
import {CryptoKeyStorageMock} from "../crypto-key-storage-mock";
import {SignalingConnection} from "../../yjsWebRTC/client/signaling-connection";
import {AccessMode} from "@inhauth/core";

@suite
class SignalingSpec {

    private parser = new TokenParser(new CryptoKeyStorageMock());
    private serverController = new YjsWebrtcController(this.parser);
    private room = 'room';

    @test
    public async oneUser() {
        const {client, announces} = await this.getClient({
            User: 'user A',
            AccessMode: AccessMode.write
        });
        expect(announces[0].room).toBe(this.room);
        expect(announces[0].users).toHaveLength(0);
    }

    @test
    public async manyUsers() {
        const {client: clientA, announces: announcesA} = await this.getClient({
            User: 'user A',
            AccessMode: AccessMode.write
        });
        const {client: clientB, announces: announcesB} = await this.getClient({
            User: 'user B',
            AccessMode: AccessMode.read
        });
        expect(announcesA[0].users).toHaveLength(0);
        expect(announcesB[0].users).toHaveLength(1);
        expect(announcesA[1].users).toHaveLength(1);
        expect(announcesA[1].users[0].user).toBe('user B');
        expect(announcesA[1].users[0].accessMode).toBe('read');
        expect(announcesB[0].users[0].user).toBe('user A');
        expect(announcesB[0].users[0].accessMode).toBe('write');
        const {client: clientC, announces: announcesC} = await this.getClient({
            User: 'user C',
            AccessMode: AccessMode.write
        });
        expect(announcesC[0].users).toHaveLength(2);
    }

    @test
    public async testSignalling() {
        const {client: clientA, announces: announcesA, signals: signalsA} = await this.getClient({
            User: 'user A',
            AccessMode: AccessMode.write
        });
        const {client: clientB, announces: announcesB} = await this.getClient({
            User: 'user B',
            AccessMode: AccessMode.read
        });
        await clientB.sendSignal({
            type: "signal",
            signal: null,
            room: this.room,
            to: announcesB[0].users[0].user
        });
        // user A should receive signal
        expect(signalsA).toHaveLength(1);
    }

    private async getClient(token) {
        const {client, server} = WebsocketMock.createPair();
        const client1 = new SignalingConnection(client as any);
        client1.register({
            room: this.room,
            token: await this.parser.stringify(token)
        });
        const announces = [];
        const signals = [];
        client1.on('announce', msg => announces.push(msg));
        client1.on('signal', signal => signals.push(signal));
        await this.serverController.handleConnection(server as any);
        return {client: client1, announces, signals};
    }

}