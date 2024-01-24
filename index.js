const WebSocket = require('ws');
const { Worker } = require('worker_threads');

const wss = new WebSocket.Server({ port: 8080 });

let clientId = 0;
let lobbyId = 0;
let clientQueue = [];
let clientStatuses = new Map();
let lobbies = new Map();

function checkQueue() {
    if (clientQueue.length >= 2) {

        // grab the first 5 clients from the queue
        const players = clientQueue.splice(0, 5);

        const lobbyWorker = new Worker('./lobby.js');

        lobbies.set(lobbyId++, {
            players: players,
            worker: lobbyWorker,
        });

        lobbyWorker.postMessage({
            type: 'matchFound',
            players: players.map(player => player.id),
        });

        lobbyWorker.on('message', (message) => {
            switch (message.type) {
                case 'choices':
                    console.log('choices received');
                    // send to player
                    const player = players.find(player => player.id === message.player);
                    player.send(JSON.stringify({
                        type: 'choices',
                        choices: message.choices,
                    }));
                    break;
                case 'lobbyUpdated':
                    // send to all players
                    players.forEach(player => {
                        player.send(JSON.stringify({
                            type: 'lobbyUpdated',
                            lobby: message.lobby,
                        }));
                    });
                    break;
                case 'gameEnded':
                    // send to all players
                    players.forEach(player => {
                        player.send(JSON.stringify({
                            type: 'gameEnded',
                            lobby: message.lobby,
                        }));
                    });
                    lobbyWorker.terminate();
                    lobbies.delete(message.lobby);
                    break;
                default:
                    break;
            }     
        });

    }
}

wss.on('connection', (ws) => {
    ws.id = clientId++;
    clientStatuses.set(ws.id, 'connected');
    console.log('Client connected');

    // ws.send(JSON.stringify({
    //     type: 'connected',
    //     id: ws.id,
    // }));

    ws.on('message', (message) => {
        try {
            message = JSON.parse(message);
        } catch (error) {
            // If it fails, send an error message to the client
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
            return;
        }

        switch (message.type) {
            case 'play':
                console.log('play received');
                clientStatuses.set(ws.id, 'queued');
                clientQueue.push(ws);
                checkQueue();
                break;
            case 'pick':
                // send to lobby worker
                const lobby = lobbies.get(message.lobby);
                lobby.worker.postMessage({
                    type: 'pick',
                    player: ws.id,
                    choice: message.choice
                });
                break;          
        
            default:
                break;
        }
    });

    ws.on('close', () => {
        switch (clientStatuses.get(ws.id)) {
            case 'queued':
                clientQueue = clientQueue.filter(client => client !== ws);                
                break;
            case 'playing':
                break;
            default:
                break;
        }
    });

    // ws.send('Hello, I am server');
});