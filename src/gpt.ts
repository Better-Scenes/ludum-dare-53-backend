import { ChatCompletionRequestMessage, ChatCompletionResponseMessage, Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

class GPTClass {
    generateTeacherPrompt = (messages: string, history: ChatCompletionRequestMessage[]): ChatCompletionRequestMessage[] => {
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
    
    generateActorPrompt = (messages: string, history: ChatCompletionRequestMessage[]): ChatCompletionRequestMessage[] => {
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
    
    generateCriticPrompt = (messages: string): ChatCompletionRequestMessage[] => {
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

    chatCompletionRequest = async (messages: ChatCompletionRequestMessage[]): Promise<ChatCompletionResponseMessage|undefined>  => {
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
            if(!response.data.choices[0].message) throw new Error('something went wrong generating the response from gpt')
            const message: ChatCompletionResponseMessage = response.data.choices[0].message
            return message
        } catch (e) {
            console.error(e)
        }
    }
}

const GPT = new GPTClass()
export default GPT;