import { ChatCompletionRequestMessage } from "openai";

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

    public getHistory(uuid: string) {
        const state = this.games.get(uuid)
        if(!state) throw new Error('Game does not exist!')
        return state.messages;
    }
}

let GameState: GameStateClass = new GameStateClass();
export default GameState