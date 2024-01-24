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
    if (message.type === 'matchFound') {
        console.log('match found');
        ws.send(JSON.stringify({
            type: 'pick',
            lobby: message.lobby,
            choice: 'rock'
        }));
    }
});

ws.on('close', function close() {
    console.log('disconnected');
});