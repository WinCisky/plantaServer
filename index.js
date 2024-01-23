const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let clientId = 0;
let lobbyId = 0;
let clientQueue = [];
let clientStatuses = {};
let lobbies = {};

function checkQueue() {
    if (clientQueue.length >= 2) {

        const player1 = clientQueue.shift();
        const player2 = clientQueue.shift();

        const msg = JSON.stringify({
            type: 'matchFound',
            lobby: lobbyId,
        });

        player1.send(msg);
        player2.send(msg);

        clientStatuses[player1.id] = 'playing';
        clientStatuses[player2.id] = 'playing';

        lobbies[lobbyId++] = {
            players: [{
                id: player1.id,
                height: 1,
                resources: [2,2,2]
            }, {
                id: player2.id,
                height: 1,
                resources: [2,2,2]
            }],
            state: 'wait',
            weather: 'sunny',
        };
    }
}

wss.on('connection', (ws) => {
    ws.id = clientId++;
    clientStatuses[ws.id] = 'connected';

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
                clientStatuses[ws.id] = 'queued';
                clientQueue.push(ws);
                checkQueue();
                break;
        
            default:
                break;
        }
    });

    ws.on('close', () => {
        switch (clientStatuses[ws.id]) {
            case 'queued':
                clientQueue = clientQueue.filter(client => client !== ws);                
                break;
            case 'playing':
                // const lobby = Object.values(lobbies).find(lobby => lobby.player1 === ws || lobby.player2 === ws);
                // if (lobby) {
                //     const otherPlayer = lobby.player1 === ws ? lobby.player2 : lobby.player1;
                //     otherPlayer.send(JSON.stringify({
                //         type: 'opponentDisconnected'
                //     }));
                //     delete lobbies[lobby.id];
                // }
                break;
            default:
                break;
        }
    });

    // ws.send('Hello, I am server');
});