const WebSocket = require('ws');
const { Worker } = require('worker_threads');

const wss = new WebSocket.Server({ port: 6666 });

let clientId = 0;
let lobbyId = 0;
let clientQueue = [];
let clientStatuses = new Map();
let lobbies = new Map();

/**
 * check if there are enough players in the queue
 * if there are, creates a new lobby
 */
function checkQueue() {
    if (clientQueue.length >= 2) {

        const players = clientQueue.splice(0, 5);
        const lobbyWorker = new Worker('./lobby.js');

        lobbies.set(lobbyId, {
            players: players,
            worker: lobbyWorker,
        });

        lobbyWorker.postMessage({
            type: 'matchFound',
            players: players.map(player => player.id),
            lobby: lobbyId,
        });

        players.forEach(player => {
            clientStatuses.set(player.id, 'playing');
            player.send(JSON.stringify({
                type: 'matchFound',
                lobby: lobbyId,
            }));
        });

        lobbyId++;

        /**
         * handle messages from the lobby worker
         */
        lobbyWorker.on('message', (message) => {
            switch (message.type) {
                case 'choices':
                    const player = players.find(player => player.id === message.player);
                    player.send(JSON.stringify({
                        type: 'choices',
                        lobby: message.lobby,
                        choices: message.choices,
                    }));
                    break;
                case 'lobbyUpdated':
                    players.forEach(player => {
                        player.send(JSON.stringify({
                            type: 'lobbyUpdated',
                            lobby: message.lobby,
                            playersChoices: message.playersChoices,
                        }));
                    });
                    break;
                case 'playerDisconnected':
                    players.forEach(player => {
                        player.send(JSON.stringify({
                            type: 'playerDisconnected',
                            player: message.player,
                        }));
                    });
                    break;
                case 'endGame':
                    players.forEach(player => {
                        player.send(JSON.stringify({
                            type: 'endGame',
                            lobby: message.lobby,
                            winner: message.winner,
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

/**
 * handle new connections
 */
wss.on('connection', (ws) => {
    ws.id = clientId++;
    clientStatuses.set(ws.id, 'connected');
    console.log('Client connected');

    /**
     * handle messages from the client
     */
    ws.on('message', (message) => {
        try {
            message = JSON.parse(message);
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
            return;
        }

        switch (message.type) {
            case 'play':
                console.log('play received');
                if (clientStatuses.get(ws.id) !== 'connected') {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid play request'
                    }));
                    return;
                }
                clientStatuses.set(ws.id, 'queued');
                clientQueue.push(ws);
                checkQueue();
                break;
            case 'pick':
                const lobby = lobbies.get(message.lobby);
                if (!lobby) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid pick request'
                    }));
                    return;
                }
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

    /**
     * handle client disconnections
     */
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
});