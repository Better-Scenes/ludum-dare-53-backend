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

export type CrowdResponse = {
    scores: {
        humor: number,
        relevance: number, 
    }
}

export type ResponseData = {
    prompt?: string
    actor?: ChatCompletionRequestMessage,
    crowd?: CrowdResponse,
    critic?: CriticResponse,
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
    data?: ResponseData
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

                    const response: WebsocketMessage = {event:  WebsocketEvents.NEW_GAME, data: {prompt} }
                    socket.send(JSON.stringify(response))
                }
                else if (data.event === WebsocketEvents.MESSAGE) {
                    const userMessage = {role: ChatCompletionRequestMessageRoleEnum.User, content: data.data}
                    const actorResponse = await GPT.chatCompletionRequest(GPT.generateActorPrompt(data.data, GameState.getHistory(uuid), GameState.getState(uuid).prompt, GameState.getState(uuid).actorPrompt));
                    let parsedActorResponse = actorResponse?.content.replace('Support: ', '')
                    parsedActorResponse = actorResponse?.content.replace('"', '')
                    const responseMessage: ChatCompletionRequestMessage = {role: ChatCompletionResponseMessageRoleEnum.Assistant, content: parsedActorResponse || 'uhhhhh...'}
                    GameState.newMessage(uuid, userMessage)
                    let crowdResponseMessage: CrowdResponse
                    try {
                        const crowdResponse = await GPT.chatCompletionRequest(GPT.generateCrowdResponse(GameState.getHistory(uuid), GameState.getState(uuid).prompt));
                        console.log("attempting JSON parse on: ", crowdResponse?.content)
                        crowdResponseMessage = JSON.parse(crowdResponse?.content as string)
                    }catch(e) {
                        crowdResponseMessage = {scores: {
                            humor: 5,
                            relevance: 5,
                        }}
                    }
                    GameState.newMessage(uuid, responseMessage)

                    const response: WebsocketMessage = {event:  WebsocketEvents.MESSAGE, data: {actor: responseMessage, crowd: crowdResponseMessage} }
                    socket.send(JSON.stringify(response))
                }
            
                else if (data.event === WebsocketEvents.FINISHED) {
                    const userMessage = {role: ChatCompletionRequestMessageRoleEnum.User, content: data.data}
                    GameState.newMessage(uuid, userMessage)

                    let responseData: CriticResponse;
                    try{
                        const criticResponse = await GPT.chatCompletionRequest(GPT.generateCriticPrompt(GameState.getHistory(uuid), GameState.getState(uuid).prompt));
                        console.log("attempting JSON parse on: ", criticResponse?.content)
                        responseData = JSON.parse(criticResponse?.content as string)
                    }catch(e){
                        responseData = {
                            scores: {
                                humor: 5,
                                originality: 5,
                                relevance: 5,
                                overall: 5,
                                },
                            feedback: "I'm sure it was a perfectly adequate performance, but I couldn't be bothered to go. (something went wrong with the server, sorry!)"}
                    }


                    let crowdResponseMessage: CrowdResponse
                    try {
                        const crowdResponse = await GPT.chatCompletionRequest(GPT.generateCrowdResponse(GameState.getHistory(uuid), GameState.getState(uuid).prompt));
                        console.log("attempting JSON parse on: ", crowdResponse?.content)
                        crowdResponseMessage = JSON.parse(crowdResponse?.content as string)
                    }catch(e) {
                        crowdResponseMessage = {scores: {
                            humor: 5,
                            relevance: 5,
                        }}
                    }

                    const response: WebsocketMessage = {event:  WebsocketEvents.FINISHED, data: {critic: responseData, crowd: crowdResponseMessage} }
                    socket.send(JSON.stringify(response))
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
