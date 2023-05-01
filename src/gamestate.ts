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

    private prompts =         [
        "You are a strong cavewoman, and you are explaining to your boyfriend that you are pregnant",
        "You are a clumsy waiter, and you are apologizing to a customer for spilling their drink",
        "You are a nervous teenager, and you are trying to ask your crush to prom",
        "You are a paranoid librarian, and you are accusing a visitor of stealing a book",
        "You are an overenthusiastic gym instructor, and you are motivating a reluctant client during their workout",
        "You are a forgetful chef, and you are trying to remember the ingredients of a dish while a sous-chef listens",
        "You are a lost tourist, and you are asking a local for directions to a famous landmark",
        "You are a talkative hairdresser, and you are sharing gossip with a client while cutting their hair",
        "You are a mischievous dog, and you are trying to convince your owner to give you a treat",
        "You are a concerned neighbor, and you are informing the tenant next door about a possible gas leak",
        "You are a persistent salesperson, and you are trying to sell an uninterested customer a vacuum cleaner"
      ]
    
    public startNewGame(uuid: string) {
        //get or generate prompt
        const prompt = this.prompts[Math.floor(Math.random() * this.prompts.length)]
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