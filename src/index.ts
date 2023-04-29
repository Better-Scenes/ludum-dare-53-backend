import * as dotenv from 'dotenv';
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import repl from 'node:repl';
import * as readline from 'readline';
import { WebSocketServer } from './websocket';

const websocketPort = 8080;
const websocketServer = new WebSocketServer(websocketPort);


const scenarios = [
    `A couple has just had a heated argument, and the woman is now tearfully pleading with her partner to forgive her and take her back.`
    , `Two former friends who have been estranged for years run into each other unexpectedly, and one of them delivers a tearful monologue about how much they miss their friendship and how sorry they are for the past.`
    , `A parent and child have a tense confrontation in which the child confesses to a serious wrongdoing, and the parent responds with angry tears and a desperate attempt to understand why their child would do such a thing.`
    , `A couple is facing a crisis, and one of them delivers a dramatic, tearful monologue about how much they love the other person and how they will do whatever it takes to save their relationship.`
    , `Two siblings who have always been close are having a tearful goodbye as one of them prepares to leave home for college or another major life event.`
    , `A character is confronted by a painful truth or realization, and they break down in tears as they struggle to come to terms with it.`
    , `Two characters are in the midst of a heated argument, and one of them suddenly breaks down in tears, revealing their vulnerability and begging for forgiveness.`
    , `A character receives devastating news, and they break down in tears as they struggle to cope with the sudden loss or change.`
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

dotenv.config();

const configuration = new Configuration({
    apiKey: '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',
});
const openai = new OpenAIApi(configuration);

const generateTeacherPrompt = (messages: string, history: ChatCompletionRequestMessage[]): ChatCompletionRequestMessage[] => {
    return [
        { role: "system", content: "You are a theater critic, you are scathing sarcastic and witty, you are watching a play" },
        {
            role: "user", content: `
            You are a theater critic, you are scathing sarcastic and witty,  you are watching a play, the user is playing a character in that play, the setting is the character is a neolithic cavewoman and she is trying to tell her boyfriend that she is pregnant. You will judge the dialogue from the user and criticize it based on some properties. 

            Use the following format, You may only respond with a single json object. Nothing else. No extra messages.
            
            FORMAT
            {
              "ratings": {
                "humor": 8, // 1-10 The most obvious factor is how funny the dialogue is, based on how much it makes people laugh or smile.
                "originality": 7, // 1-10  How well does the dialogue avoid cliches and tropes, how creative is the dialogue.
                "relevance": 6, // 1-10  How well does the dialogue fit with the scene and character description.
                "overall": 7, // 1-10  How well did the user do overall.
                "feedback": "Your feedback about the joke" // give a short piece of feedback for the comedian about their joke, keep this to 300 characters
              }
            }
            ${history.map(h => {
                return `${h.role}: ${h.content}`
            }).join('\n')}
            User: ${messages}
      ` },
    ]
}

const generateActorPrompt = (messages: string, history: ChatCompletionRequestMessage[]): ChatCompletionRequestMessage[] => {
    return [
        { role: "system", content: "you are in a play, you are playing a character" },
        {
            role: "user", content: `
            you are in a play, you are playing a character, the setting is the character is a neolithic cavewoman and she is trying to tell her boyfriend that she is pregnant, write one short line of dialogue, make it very funny
            ${history.map(h => {
                return `${h.role}: ${h.content}`
            }).join('\n')}
            User: ${messages}
            Assistant: {your response}
      ` },
    ]
}

const generateCriticPrompt = (messages: string): ChatCompletionRequestMessage[] => {
    return [
        { role: "system", content: "You are a twitch chatbot, you are assessing how excited the chat is based on average messages" },
        {
            role: "user", content: `
      You are a twitch chatbot, you are assessing how excited the chat is based on average messages|
      This is an array of numbers, each number represents the number of chat messages sent per second in a twitch chat: ${messages}|
      The most recent number is the last number, please assess the last 10 numbers, compared to all of the previous numbers, how excited is chat right now?|
      Keep your answer very short, answer on a scale from 1-10
      ` },
    ]
}

const chatCompletionRequest = async (messages: ChatCompletionRequestMessage[]) => {
    console.log(messages)
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 300,
            n: 1,
            temperature: 1,
        });
        console.log(response.data.choices)
        console.log(response.data.usage)
        return response.data.choices[0].message?.content
    } catch (e) {
        console.error(e)
    }
}

function askQuestion(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
}

async function main() {
    const dialogueHistory: ChatCompletionRequestMessage[] = [];
    console.log("Your prompt is you are a cavewoman explaining that you are pregnant to your boyfriend")
    while (true) {
        const userDialogue = await askQuestion('What do you say?');
        const feedback = await chatCompletionRequest(generateTeacherPrompt(userDialogue, dialogueHistory));
        console.log({ feedback });
        const otherActor = await chatCompletionRequest(generateActorPrompt(userDialogue, dialogueHistory));
        console.log({ otherActor })
        dialogueHistory.push({ role: 'user', content: userDialogue })
        dialogueHistory.push({ role: 'assistant', content: otherActor || '' })
        console.log({ dialogueHistory })
    }

    rl.close();
}

main();