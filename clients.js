const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

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
            console.log('match found');
            ws.send(JSON.stringify({
                type: 'pick',
                lobby: message.lobby,
                choice: 'rock'
            }));
            break;
        case 'playerDisconnected':
            console.log('player disconnected');
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