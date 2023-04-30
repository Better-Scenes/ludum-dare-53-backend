import * as dotenv from 'dotenv';
dotenv.config();
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import * as readline from 'readline';
import { WebSocketServer } from './websocket';
import GameState from './gamestate';

const port = parseInt(process.env.PORT || '8080'); // Fallback to 3000 if running locally
const websocketServer = new WebSocketServer(port);


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