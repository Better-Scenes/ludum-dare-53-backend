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
                You are the collective minds of the audience in a play, you are watching an improv show where the actors are given a prompt, you are reacting to each line of dialogue.
                You love a good joke. You love it when they use the prompt.
                
                Here is the prompt the actors were given, use this for context:
                ${prompt}

                Here is the transcript from the show so far, they are improvising based on the prompt:
                ${ messages.map(h => {
                    return `${h.role == 'user' ? 'Actor' : 'Support'}: ${h.content}`
                }).join('\n') }

                Ignoring the support actor how do you feel about the lead actors performance?
                Use the following format. Your response must be valid json. You may only respond with a single json object. Nothing else. No extra messages.
                {
                  "scores": {
                    "humor": {score}, // 1-10 How funny is the actors last line? Are they making you laugh or are they boring?.
                    "relevance": {score} // 1-10  How well did it keep with the prompt? Does it make sense? Did it make you happy or angry?.
                    },
                    "feedback": "{your_message}" // Give your thoughts here, summarize your feelings? keep this to 20 words or less
                }
          `.replace(/[ \t]{2,}/g, '')},
        ]
    }
    
    generateActorPrompt = (messages: string, history: ChatCompletionRequestMessage[], prompt: string, role: string): ChatCompletionRequestMessage[] => {
        console.log({messages}, {history})
        return [
            { role: "system", content: "you are the supporting actor in a play, you are doing improv comedy" },
            {
                role: "user", content: `
                An actor has just delivered a line of dialogue: ${messages}
                Here is the prompt they were given: ${prompt}
                You are the supporting actor, your role is: ${role}
                ${history.length > 0 ? "Here is the entire transcript of the show, including past messages you sent (you are Support), you should use this for context only" : ""}
                ${ history.length > 0 ? history.map(h => {
                    return `${h.role == 'user' ? 'Actor' : 'Support'}: ${h.content}`
                }).join('\n') : '' }
                You are an improv comedian, you are extremely funny, witty, sometimes a bit silly and playful. You like slapstick comedy and act out your actions like this "*{verb or action}*"
                You should consider the last line of dialogue from the Actor, and come up with a response that is funny, and makes sense with the prompt, if the actor gave bad dialogue just make something up
                Keep your response short, no more than 25 words. Write out your response in character, 
                You must respond with only a single line of dialogue, nothing else, do not wrap the response in quotation marks, do not prefix your response with anything
                Do not start your message with anything like "Support: " or "Friend: " do not use any prefixes at all.
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
                You love a good joke, you love it when they stick to the prompt.

                Here is the prompt they were given:
                ${prompt}

                Here is the transcript from the show:
                ${ messages.map(h => {
                    return `${h.role == 'user' ? 'Actor' : 'Support'}: ${h.content}`
                }).join('\n') }

                You are judging the Actor their lines start with "Actor:", not "Support:". Only critique the Actor's performance based on their lines. Ignore dialogue from Support.
                Use the following JSON format. Your response must be valid JSON. You may only respond with a single JSON object. Nothing else. No extra messages.
                {
                  "scores": {
                    "humor": {score}, // 1-10 How funny were the Actor's lines?.
                    "originality": {score}, // 1-10  How well does the actor's dialogue avoid cliches and tropes, how creative is the Actor?
                    "relevance": {score}, // 1-10  How well does the Actor's dialogue fit with the prompt?
                    "overall": {score} // 1-10  How well did the actor do overall.
                    },
                    "feedback": "{critique}" // Write an overly wordy, dramatic theater style critique that will appear in the newspaper on the show and the actor's performance, did they keep to the prompt? were they funny and original? keep this to 75 words or less
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