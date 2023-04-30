import { ChatCompletionRequestMessage } from "openai";
import { CriticResponse } from "./websocket";

export type GameCriticism = {
    scores: {
        humor: number,
        originality: number,
        relevance: number,
        overall: number,
    },
    feedback: string
}

export type GameData = {
    prompt: string,
    messages: ChatCompletionRequestMessage[],
    critic?: GameCriticism
}

class GameStateClass {

    private games: Map<string, GameData> = new Map();
    
    public startNewGame(uuid: string) {
        //get or generate prompt
        const prompt = "You are a cavewoman, you are trying to explain to your boyfriend that you are pregnant"
        const gameData: GameData = {
            prompt,
            messages: []
        }
        this.games.set(uuid, gameData)
        return prompt
    }

    public newMessage(uuid: string, message: ChatCompletionRequestMessage) {
        const state = this.games.get(uuid)
        if(!state) throw new Error('Game does not exist!')
        state.messages.push(message)
        this.games.set(uuid, state);
    }

    public getHistory(uuid: string): ChatCompletionRequestMessage[] {
        const state = this.games.get(uuid)
        if(!state) throw new Error('Game does not exist!')
        return state.messages;
    }

    public newFeedback(uuid: string, feedback: CriticResponse){
        const state = this.games.get(uuid)
        if(!state) throw new Error('Game does not exist!')
        state.critic = feedback
        this.games.set(uuid, state);
    }

    public getState(uuid: string): GameData {
        const state = this.games.get(uuid)
        if(!state) throw new Error('Game does not exist!')
        return state;
    }
}

let GameState: GameStateClass = new GameStateClass();
export default GameState