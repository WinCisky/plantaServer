const { parentPort } = require('worker_threads');

let gameEnded = false;
const CHOICES = 5;
const TIMEOUT = 10000;
const lobby = {
    players: [],
    state: 'wait',
    weather: 'sunny',
};

/**
 * initialization of the lobby
 * @param {Array} playersData
 */
function initializeLobby(playersData) {
    for (let i = 0; i < playersData.length; i++) {
        lobby.players.push({
            id: playersData[i],
            height: 1,
            resources: [2,2,2],
            choices: [0,0,0],
            pick: 0,
            lastSeen: Date.now(),
        });
    }
    console.log('lobby initialized');
}

/**
 * randomly select 3 options
 * @returns {Array} random choices
 */
function randomChoices() {
    return [
        Math.floor(Math.random() * CHOICES),
        Math.floor(Math.random() * CHOICES),
        Math.floor(Math.random() * CHOICES),
    ];
}

/**
 * update lastSeen of the player
 * @param {number} playerId
 */
function updateLasteSeen(playerId) {
    const player = lobby.players.find(player => player.id === playerId);
    player.lastSeen = Date.now();
}

/**
 * check if there are disconnected players
 * if there are, send a message to all the other players
 * and remove the disconnected player from the lobby
 */
function checkDisconnectedPlayers() {
    const now = Date.now();
    const toRemove = [];
    for (let i = 0; i < lobby.players.length; i++) {
        if ((now - lobby.players[i].lastSeen) > TIMEOUT) {
            console.log('player disconnected', lobby.players[i].id);
            for (let j = 0; j < lobby.players.length; j++) {
                if (i == j) continue;
                sendPlayerDisconnected(lobby.players[j].id);
            }
            toRemove.push(i);
        }
    }

    lobby.players = lobby.players.filter((player, i) => !toRemove.includes(i));
    console.log('players left', lobby.players.length);
    console.log('players', lobby.players);

    if (lobby.players.length < 2) {
        sendEndGame();
        gameEnded = true;
    }
}

/**
 * send choices to all the players
 */
function sendChoices() {
    for (let i = 0; i < lobby.players.length; i++) {
        const choices = randomChoices();
        lobby.players[i].choices = choices;
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



// --- MESSAGES SEND START ---

/**
 * send player disconnected message to the main thread
 * @param {number} playerId 
 */
function sendPlayerDisconnected(playerId) {
    parentPort.postMessage({
        type: 'playerDisconnected',
        player: playerId,
    });
}

/**
 * send end game message to the main thread
 */
function sendEndGame() {
    parentPort.postMessage({
        type: 'endGame',
    });
}

// --- MESSAGES SEND END ---



// --- MESSAGES RECEIVE START ---

/**
 * receive messages from the main thread and handles them
 * @param {MessageEvent} event 
 */
parentPort.onmessage = function(event) {
    console.log('Received message from main thread:', event.data);

    switch (event.data.type) {
        case 'matchFound':
            initializeLobby(event.data.players);
            break;
        case 'pick':
            // TODO
            console.log('pick received', event.data);
            updateLasteSeen(event.data.player);
            break;
        case 'pong':
            updateLasteSeen(event.data.player);
            break;
        default:
            break;
    }
};

// --- MESSAGES RECEIVE END ---

/* main loop for the lobby */
async function main() {
    do {
        console.log('loop');
        await new Promise(resolve => setTimeout(resolve, 5000));
        sendChoices();
        console.log('loop');
        await new Promise(resolve => setTimeout(resolve, 5000));
        updateLobbyWithChoices();
        checkDisconnectedPlayers();
    } while (!gameEnded);
}

console.log('lobby started');
main();

/* interval for not ending the lobby */
const intervalId = setInterval(() => {
    if (gameEnded) {
        clearInterval(intervalId);
    }
}, 5000);