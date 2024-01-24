const { parentPort } = require('worker_threads');

let gameEnded = false;
const CHOICES = 5;
const lobby = {
    players: [],
    state: 'wait',
    weather: 'sunny',
};

function initializeLobby(playersData) {
    for (let i = 0; i < playersData.length; i++) {
        lobby.players.push({
            id: playersData[i],
            height: 1,
            resources: [2,2,2],
            choices: [],
            pick: null,
        });
    }
    console.log('lobby initialized');
}

// Riceve un messaggio dal thread principale
parentPort.onmessage = function(event) {
    console.log('Received message from main thread:', event.data);

    switch (event.data.type) {
        case 'matchFound':
            initializeLobby(event.data.players);
            break;
        case 'pick':
            // TODO
            console.log('pick received', event.data);
            break;
        default:
            break;
    }
};

function sendChoices() {
    for (let i = 0; i < lobby.players.length; i++) {
        const choices = randomChoices();
        parentPort.postMessage({
            type: 'choices',
            player: lobby.players[i].id,
            choices: choices,
        });
    }

    console.log('choices sent');
}

function sendUpdatedLobby() {
    // TODO
    console.log('send lobby updated');
}

function checkGameEnded() {
    // TODO
    return false;
}

function updateLobbyWithChoices() {
    // TODO
    sendUpdatedLobby();
    gameEnded = checkGameEnded();
    console.log('lobby updated');
}

function sendEndGame() {
    parentPort.postMessage({
        type: 'endGame',
    });
}

function randomChoices() {
    return [
        Math.floor(Math.random() * CHOICES),
        Math.floor(Math.random() * CHOICES),
        Math.floor(Math.random() * CHOICES),
    ];
}

async function main() {
    do {
        console.log('loop');
        await new Promise(resolve => setTimeout(resolve, 5000));
        sendChoices();
        console.log('loop');
        await new Promise(resolve => setTimeout(resolve, 5000));
        updateLobbyWithChoices();
    } while (!gameEnded);
}

console.log('lobby started');
main();

const intervalId = setInterval(() => {
    if (gameEnded) {
        clearInterval(intervalId);
    }
}, 5000);