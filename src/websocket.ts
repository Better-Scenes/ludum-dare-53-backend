import { Server, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import GameState from './gamestate';
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum, ChatCompletionResponseMessageRoleEnum } from 'openai';
import GPT from './gpt';

export type CriticResponse = {
    scores: {
        humor: number,
        originality: number, 
        relevance: number, 
        overall: number
    }
    feedback: string
}

export enum WebsocketEvents {
    CONNECT = 'CONNECT', // user is connecting or server is responding with uuid
    NEW_GAME = 'NEW_GAME', // when the user is starting a new game
    MESSAGE = 'MESSAGE', // message from the user, e.g sending their prompt
    FINISHED = 'FINISHED', // used for signalling the round is concluded and critic prompt should be written
}
export type WebsocketMessage = {
    event: WebsocketEvents,
    uuid?: string, //unique identifier from client
    data?: any
}

const connections: Map<string, WebSocket> = new Map();

const testMessages: ChatCompletionRequestMessage[] = [
    {role: 'user', content: 'oh no! me be have baby in belly!'},
    {role: 'assistant', content: 'Ugg, me think you need bigger leopard print loincloth to make room for little cavebaby.'},
    {role: 'user', content: 'if me need new loincloth then me also need new cave! Start digging!'},
]

const testBadMessages: ChatCompletionRequestMessage[] = [
    {role: 'user', content: 'unga bunga me cavewoman me like potatos!'},
    {role: 'assistant', content: 'Why you like potatos?'},
    {role: 'user', content: 'potato potato potat'},
]

export class WebSocketServer {
    private server: Server;
    PING_INTERVAL = 30 * 1000; // 30 seconds in milliseconds

    constructor(port: number) {
        this.server = new Server({ port });
        setInterval(() => this.sendPingsToClients(), this.PING_INTERVAL);

        this.server.on('connection',async (socket) => {
            let uuid: string = '';
            console.log(`Client connected`);

            // uncomment to test critic messages
            // const criticResponse = await GPT.chatCompletionRequest(GPT.generateCriticPrompt(testMessages, 'you are a cavewoman telling her boyfriend she is pregnant'));
            // console.log("attempting to parse: ", criticResponse?.content)
            // const responseData = JSON.parse(criticResponse?.content as string)
            // console.log(responseData)

            socket.on('message', async (rawData) => {
                    const data = JSON.parse(rawData.toString())
                if (data.event === WebsocketEvents.CONNECT) {
                    uuid = uuidv4();
                    connections.set(uuid, socket);
                    socket.send(JSON.stringify({ event: WebsocketEvents.CONNECT, data: uuid }))
                    console.log("Connection established: ", uuid)
                }
                else if (data.event === WebsocketEvents.NEW_GAME) {
                    // create a new entry for the uuid in the game data table
                    // generate a new scene prompt and send it
                    console.log("New game message: ", uuid)
                    const prompt = GameState.startNewGame(uuid)
                    socket.send(JSON.stringify({ event: WebsocketEvents.NEW_GAME, data: prompt }))
                }
                else if (data.event === WebsocketEvents.MESSAGE) {
                    const userMessage = {role: ChatCompletionRequestMessageRoleEnum.User, content: data.data}
                    const actorResponse = await GPT.chatCompletionRequest(GPT.generateActorPrompt(data.data, GameState.getHistory(uuid)));
                    let parsedActorResponse = actorResponse?.content.replace('Support: ', '')
                    parsedActorResponse = actorResponse?.content.replace('"', '')
                    const responseMessage: ChatCompletionRequestMessage = {role: ChatCompletionResponseMessageRoleEnum.Assistant, content: parsedActorResponse || 'uhhhhh...'}
                    GameState.newMessage(uuid, userMessage)
                    GameState.newMessage(uuid, responseMessage)
                    socket.send(JSON.stringify({ event: WebsocketEvents.MESSAGE, data: responseMessage }))
                }
            
                else if (data.event === WebsocketEvents.FINISHED) {
                    const userMessage = {role: ChatCompletionRequestMessageRoleEnum.User, content: data.data}
                    const criticResponse = await GPT.chatCompletionRequest(GPT.generateCriticPrompt(GameState.getHistory(uuid), GameState.getState(uuid).prompt));
                    console.log("attempting to parse: ", criticResponse?.content)
                    const responseData = JSON.parse(criticResponse?.content as string)
                    console.log(responseData)
                    GameState.newMessage(uuid, userMessage)
                    socket.send(JSON.stringify({ event: WebsocketEvents.FINISHED, data: responseData }))
                }
            });

            socket.on('close', () => {
                console.log('Client disconnected');
                connections.delete(uuid);
            });
        });         

        console.log(`WebSocket server started on port ${port}`);
    }
    
    sendPingsToClients = () => {
        this.server.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.ping();
          }
        });
      }
}
