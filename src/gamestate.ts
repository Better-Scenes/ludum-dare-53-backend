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
    actorPrompt: string,
    playerPrompt: string,
    messages: ChatCompletionRequestMessage[],
    critic?: GameCriticism
}

class GameStateClass {

    private games: Map<string, GameData> = new Map();

    private prompts = [
        {
            "prompt": "You are a nervous astronaut, trying to convince your skeptical spouse that you'll be safe during your upcoming mission.",
            "actor": "You are a nervous astronaut.",
            "support": "You are the astronaut's skeptical spouse."
        },
        {
            "prompt": "You are a clumsy chef, desperately trying to hide the fact that you've burned the main dish from a food critic.",
            "actor": "You are a clumsy chef.",
            "support": "You are a curious food critic."
        },
        {
            "prompt": "You are a forgetful superhero, trying to remember your superhero name during a press conference.",
            "actor": "You are a forgetful superhero.",
            "support": "You are a confused journalist at the press conference."
        },
        {
            "prompt": "You are a time traveler from the future, struggling to understand the concept of a smartphone.",
            "actor": "You are a time traveler from the future.",
            "support": "You are a helpful friend trying to explain smartphones."
        },
        {
            "prompt": "You are a chatty dentist, making small talk while working on a very anxious patient's teeth.",
            "actor": "You are a chatty dentist.",
            "support": "You are an anxious dental patient."
        },
        {
            "prompt": "You are a frustrated parent, trying to assemble a complicated toy for your child while following confusing instructions.",
            "actor": "You are a frustrated parent.",
            "support": "You are the child waiting for the toy to be assembled."
        },
        {
            "prompt": "You are an overly enthusiastic personal trainer, motivating your client who is clearly not enjoying their workout.",
            "actor": "You are an overly enthusiastic personal trainer.",
            "support": "You are an unenthusiastic client during a workout session."
        },
        {
            "prompt": "You are a pirate captain, explaining to your crew why you are now a vegan and won't allow any meat on the ship.",
            "actor": "You are a pirate captain.",
            "support": "You are a skeptical crew member."
        },
        {
            "prompt": "You are a lost tourist, trying to communicate with a local who speaks a different language and uses exaggerated gestures.",
            "actor": "You are a lost tourist.",
            "support": "You are a local who speaks a different language."
        },
        {
            "prompt": "You are a magician's assistant, secretly terrified of rabbits, trying to hide your fear during a rabbit-based magic trick.",
            "actor": "You are a magician's assistant, terrified of rabbits.",
            "support": "You are a magician performing a rabbit-based trick."
        },
        {
            "prompt": "You are a hungry student, trying to convince your friend to share their lunch with you.",
            "actor": "You are a hungry student.",
            "support": "You are the friend with the lunch."
        },
        {
            "prompt": "You are a detective, trying to solve the mystery of the missing cookie with the help of your assistant.",
            "actor": "You are a detective.",
            "support": "You are the detective's assistant."
        },
        {
            "prompt": "You are a superhero, teaching your sidekick how to properly wear a cape.",
            "actor": "You are a superhero.",
            "support": "You are the superhero's sidekick."
        },
        {
            "prompt": "You are a nervous speller, trying to spell a word correctly in a spelling bee, while your friend in the audience tries to help.",
            "actor": "You are a nervous speller.",
            "support": "You are the helpful friend in the audience."
        },
        {
            "prompt": "You are a lost hiker, trying to read a map and find your way back with the help of your friend.",
            "actor": "You are a lost hiker.",
            "support": "You are the helpful friend."
        },
        {
            "prompt": "You are a scientist, trying to explain a simple experiment to your curious friend.",
            "actor": "You are a scientist.",
            "support": "You are a curious friend."
        },
        {
            "prompt": "You are a zookeeper, describing your favorite animal to an excited child.",
            "actor": "You are a zookeeper.",
            "support": "You are an excited child."
        },
        {
            "prompt": "You are a talkative pet parrot, trying to have a conversation with your confused owner.",
            "actor": "You are a talkative pet parrot.",
            "support": "You are the confused owner."
        },
        {
            "prompt": "You are a weather reporter, trying to report the weather while your friend acts as the wind and rain.",
            "actor": "You are a weather reporter.",
            "support": "You are the friend acting as the wind and rain."
        },
        {
            "prompt": "You are a gardener, trying to plant a flower while your friend pretends to be an uncooperative garden hose.",
            "actor": "You are a gardener.",
            "support": "You are the friend pretending to be a garden hose."
        },
        {
            "prompt": "You are an alien visiting Earth, trying to understand human emotions while conversing with your new human friend.",
            "actor": "You are an alien with a unique language pattern.",
            "support": "You are the human friend trying to explain emotions."
        },
        {
            "prompt": "You are a robot trying to learn about humor, asking a joke-telling friend to explain why jokes are funny.",
            "actor": "You are a robot with a monotone typing pattern.",
            "support": "You are the joke-telling friend."
        },
        {
            "prompt": "You are a caveman who just discovered fire, excitedly sharing your discovery with your fellow caveman friend.",
            "actor": "You are a caveman with simplistic language.",
            "support": "You are the fellow caveman friend."
        },
        {
            "prompt": "You are a pirate captain, trying to teach your crewmate how to read a treasure map with exaggerated pirate expressions.",
            "actor": "You are a pirate captain with exaggerated pirate expressions.",
            "support": "You are the curious crewmate."
        },
        {
            "prompt": "You are a medieval knight, explaining to your squire the importance of chivalry with old-fashioned language.",
            "actor": "You are a medieval knight with old-fashioned language.",
            "support": "You are the attentive squire."
        }
    ]

    public startNewGame(uuid: string) {
        //get or generate prompt
        const promptData = this.prompts[Math.floor(Math.random() * this.prompts.length)]
        const gameData: GameData = {
            prompt: promptData.prompt,
            playerPrompt: promptData.actor,
            actorPrompt: promptData.support,
            messages: []
        }
        this.games.set(uuid, gameData)
        return promptData.prompt
    }

    public newMessage(uuid: string, message: ChatCompletionRequestMessage) {
        const state = this.games.get(uuid)
        if (!state) throw new Error('Game does not exist!')
        state.messages.push(message)
        this.games.set(uuid, state);
    }

    public getHistory(uuid: string): ChatCompletionRequestMessage[] {
        const state = this.games.get(uuid)
        if (!state) throw new Error('Game does not exist!')
        return state.messages;
    }

    public newFeedback(uuid: string, feedback: CriticResponse) {
        const state = this.games.get(uuid)
        if (!state) throw new Error('Game does not exist!')
        state.critic = feedback
        this.games.set(uuid, state);
    }

    public getState(uuid: string): GameData {
        const state = this.games.get(uuid)
        if (!state) throw new Error('Game does not exist!')
        return state;
    }
}

let GameState: GameStateClass = new GameStateClass();
export default GameState