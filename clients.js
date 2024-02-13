require('dotenv').config();
const WebSocket = require('ws');

let possibleChoices = [0,0,0];
const serverUrl = process.env.NODE_ENV === 'production' 
    ? 'ws://planta.opentrust.it:8080' 
    : 'ws://localhost:6666';

const ws = new WebSocket(serverUrl);
let lobby = -1;

ws.on('open', function open() {
    console.log('connected');
    ws.send(JSON.stringify({
        type: 'play'
    }));
});

ws.on('message', function incoming(data) {    
    const message = JSON.parse(data);
    console.log(message);
    switch (message.type) {
        case 'error':
            console.log('error');
            break;
        case 'matchFound':
            lobby = message.lobby;
            console.log('match found');
            ws.send(JSON.stringify({
                type: 'pick',
                lobby: lobby,
                choice: randomChoice()
            }));
            break;
        case 'playerDisconnected':
            console.log('player disconnected');
            break;
        case 'choices':
            possibleChoices = message.choices;
            ws.send(JSON.stringify({
                type: 'pick',
                lobby: lobby,
                choice: randomChoice()
            }));
            break;
        case 'endGame':
            console.log('end game');
            ws.close();
            break;
        default:
            break;
    }
});

ws.on('close', function close() {
    console.log('disconnected');
});


function randomChoice() {
    const choice = possibleChoices[Math.floor(Math.random() * possibleChoices.length)];
    console.log('choice', choice);
    return choice;
}