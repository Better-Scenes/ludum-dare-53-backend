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
                  "scores": {
                    "humor": 8, // 1-10 The most obvious factor is how funny the dialogue is, based on how much it makes people laugh or smile.
                    "originality": 7, // 1-10  How well does the dialogue avoid cliches and tropes, how creative is the dialogue.
                    "relevance": 6, // 1-10  How well does the dialogue fit with the scene and character description.
                    "overall": 7 // 1-10  How well did the user do overall.
                    },
                    "feedback": "Your feedback about the joke" // give a short piece of feedback for the comedian about their joke, keep this to 300 characters
                }
                ${history.map(h => {
                    return `${h.role}: ${h.content}`
                }).join('\n')}
                User: ${messages}
          `.replace(/[ \t]{2,}/g, '')},
        ]
    }
    
    generateActorPrompt = (messages: string, history: ChatCompletionRequestMessage[]): ChatCompletionRequestMessage[] => {
        console.log({messages}, {history})
        return [
            { role: "system", content: "you are in a play, you are playing a character" },
            {
                role: "user", content: `
                You are doing improv comedy on a stage, you are working with another actor and supporting them. You play "the other character" in the setting and your job is to respond to the actor while in character
                You are a comedian, you are extremely funny, witty, sometimes a bit silly and playful, you are very good at supporting other actors. You like slapstick comedy and act out your actions like this "*{verb or action}*"
                The setting is provided to the main actor, this is what was given to them: "you are a neolithic cavewoman and she is trying to tell her boyfriend that she is pregnant"

                Create a response that matches the setting, responds to the user in some way, and tries to set them up for an easy joke
                Keep the answer short, punchy and to the point, no more than 25 words
                Now write out your response in character, do not wrap the message in quotation marks, do not prefix your response with "Support:" or anything else

                Here is the script so far:
                ${history.length > 0 ? history.map(h => {
                    return `${h.role == 'user' ? 'Actor' : 'Support'}: ${h.content}`
                }).join('\n') : '' }
                Actor: ${messages}
                Support: {your_response}
          `.replace(/[ \t]{2,}/g, '') },
        ]
    }
    
    generateCriticPrompt = (messages: ChatCompletionRequestMessage[], prompt: string): ChatCompletionRequestMessage[] => {
        return [
            { role: "system", content: "You are a theater critic, you are watching an improv show" },
            {
                role: "user", content: `
                You are a theater critic, you have watched an improv show. You are reviewing an actor, you will be given the script for reference.
                Your critiques are scathing, sarcastic, over-confident and harsh.

                Here is the prompt they were given:
                ${prompt}

                Here is the script from the show:
                ${ messages.map(h => {
                    return `${h.role == 'user' ? 'Actor' : 'Support'}: ${h.content}`
                }).join('\n') }

                Use the following format, You may only respond with a single json object. Nothing else. No extra messages.
                {
                  "scores": {
                    "humor": {score}, // 1-10 The most obvious factor is how funny the actor's dialogue is, based on how much it makes people laugh or smile.
                    "originality": {score}, // 1-10  How well does the actor's dialogue avoid cliches and tropes, how creative is the dialogue.
                    "relevance": {score}, // 1-10  How well does the actor's dialogue fit with the scene and character description, how well did they interract with the support?
                    "overall": {score}, // 1-10  How well did the actor do overall.
                    },
                    "feedback": "{critique}" // Give your thoughts on the show and the actor's performance, did they keep to the prompt? were they funny and original? keep this to 30 words or less
                }
          `.replace(/[ \t]{2,}/g, '')},
        ]
    }

    chatCompletionRequest = async (messages: ChatCompletionRequestMessage[]): Promise<ChatCompletionResponseMessage|undefined>  => {
        try {
            console.log(messages)
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
            message.content = message.content.replace('Support: ', '')
            message.content = message.content.replace('"', '')
            return message
        } catch (e) {
            console.error(e)
        }
    }
}

const GPT = new GPTClass()
export default GPT;