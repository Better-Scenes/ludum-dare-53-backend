import { ChatCompletionRequestMessage, ChatCompletionResponseMessage, Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});


const openai = new OpenAIApi(configuration);

class GPTClass {
    generateCrowdResponse = (messages: ChatCompletionRequestMessage[], prompt: string): ChatCompletionRequestMessage[] => {
        return [
            { role: "system", content: "You are the audience in a play" },
            {
                role: "user", content: `
                You are the collective minds of the audience in a play, you are watching an improv show, you are reacting to each line of dialogue.
                You love a good joke.
                
                You have two dimensions of moods
                MOODS
                Boredom: How funny is the line of dialogue, are you bored or having fun?
                Anger: How well did the dialogue match the prompt, does it make you happy or angry?
                
                Here is the prompt the actors were given, use this to help determine how whether you are happy or angry:
                ${prompt}

                Here is the transcript from the show so far:
                ${ messages.map(h => {
                    return `${h.role == 'user' ? 'Actor' : 'Support'}: ${h.content}`
                }).join('\n') }

                How did the last line of the transcript make you feel?
                Use the following format, You may only respond with a single json object. Nothing else. No extra messages.
                {
                  "scores": {
                    "boredom": {score}, // 1-10 How funny was the last line? Are they making you laugh or are they boring? A higher score means you are more bored.
                    "anger": {score}, // 1-10  How well did the last line match the given prompt? Does it make sense? Did it make you happy or angry? A higher score means you are more angry.
                    },
                    "feedback": "{your_message}" // Give your thoughts here, summarize your feelings? keep this to 20 words or less
                }
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
                You are a theater critic, you have watched an improv show, You are reviewing an actor, you will be given the transcript of the show to review.
                You are sarcastic, witty, and snarky.
                Your critiques are known to be harsh but fair.
                You love a good joke

                Here is the prompt they were given:
                ${prompt}

                Here is the transcript from the show:
                ${ messages.map(h => {
                    return `${h.role == 'user' ? 'Actor' : 'Support'}: ${h.content}`
                }).join('\n') }

                You are judging the Actor, not the Support. Only critique the Actor's performance based on their lines. Ignore dialogue from Support.
                Use the following format, You may only respond with a single json object. Nothing else. No extra messages.
                {
                  "scores": {
                    "humor": {score}, // 1-10 How funny were the Actor's lines?.
                    "originality": {score}, // 1-10  How well does the actor's dialogue avoid cliches and tropes, how creative is the Actor?
                    "relevance": {score}, // 1-10  How well does the Actor's dialogue fit with the prompt?
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
            return message
        } catch (e) {
            console.error(e)
        }
    }
}

const GPT = new GPTClass()
export default GPT;