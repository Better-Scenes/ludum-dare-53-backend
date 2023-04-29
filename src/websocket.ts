import { Server, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

export enum WebsocketEvents {
    CONNECT = 'CONNECT', // user is connecting or server is responding with uuid
    NEW_GAME = 'NEW_GAME', // when the user is starting a new game
    MESSAGE = 'MESSAGE', // message from the user, e.g sending their prompt
}
export type WebsocketMessage = {
    event: WebsocketEvents,
    uuid?: string, //unique identifier from client
    data: any
}

const connections: Map<string, WebSocket> = new Map();

export class WebSocketServer {
    private server: Server;

    constructor(port: number) {
        this.server = new Server({ port });

        this.server.on('connection', (socket) => {
            let uuid: string = '';
            console.log(`Client connected`);

            socket.on('message', (rawData) => {
                console.log(`Received raw: ${rawData}`);
                const data = JSON.parse(rawData.toString())
                this.handleMessage(data, socket)
                if (data.event === WebsocketEvents.CONNECT) {
                    uuid = uuidv4();
                    connections.set(uuid, socket);
                    socket.emit(JSON.stringify({ event: WebsocketEvents.CONNECT, data: uuid }))
                }
                else if (data.event === WebsocketEvents.NEW_GAME) {

                }
                else if (data.event === WebsocketEvents.MESSAGE) {

                }
            });

            socket.on('close', () => {
                console.log('Client disconnected');
                connections.delete(uuid);
            });
        });

        console.log(`WebSocket server started on port ${port}`);
    }

    handleMessage = (message: WebsocketMessage, socket: WebSocket) => {

    }
}
