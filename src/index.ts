import * as dotenv from 'dotenv';
dotenv.config();
import { WebSocketServer } from './websocket';
import GameState from './gamestate';

const port = parseInt(process.env.PORT || '8080'); // Fallback to 3000 if running locally
const websocketServer = new WebSocketServer(port);

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    // Add any additional error handling or logging you need
  });
  
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
    // Add any additional error handling or logging you need
});