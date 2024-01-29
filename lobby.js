const { parentPort } = require('worker_threads');

let gameEnded = false;
let lobbyId = 0;
const CHOICES = 5;
const TIMEOUT = 30000;
const lobby = {
    players: [],
    state: 'wait',
    weather: 'sunny',
};

/**
 * initialization of the lobby
 * @param {Array} playersData
 */
function initializeLobby(playersData, lobbyId) {
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
    this.lobbyId = lobbyId;
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
            for (let j = 0; j < lobby.players.length; j++) {
                if (i == j) continue;
                sendPlayerDisconnected(lobby.players[j].id);
            }
            toRemove.push(i);
        }
    }

    lobby.players = lobby.players.filter((player, i) => !toRemove.includes(i));

    if (lobby.players.length < 2) {
        sendEndGame();
        gameEnded = true;
    }
}

/**
 * send choices to every player of the lobby
 */
function sendChoices() {
    for (let i = 0; i < lobby.players.length; i++) {
        const choices = randomChoices();
        lobby.players[i].choices = choices;
        parentPort.postMessage({
            type: 'choices',
            player: lobby.players[i].id,
            lobby: lobbyId,
            choices: choices,
        });
    }
}

/**
 * send updated lobby to every player of the lobby
 * with the choices of every player
 */
function sendUpdatedLobby() {
    parentPort.postMessage({
        type: 'lobbyUpdated',
        lobby: lobbyId,
        playersChoices: lobby.players.map(player => {
            return {
                id: player.id,
                pick: player.pick,
            };
        })
    });
}

/**
 * update the resources of the player
 * @param {Object} player 
 * @param {number} choice
 */
function updatePlayerResources(player, choice) {
    switch (choice) {
        case 0:
            player.resources[0]++;
            player.height++;
            break;
        case 1:
            player.resources[1]++;
            break;
        case 2:
            player.resources[2]++;
            break;
        default:
            break;
    }
}

/**
 * update the resources of every player
 */
function updatePlayersResources() {
    for (let i = 0; i < lobby.players.length; i++) {
        updatePlayerResources(lobby.players[i], lobby.players[i].pick);
    }
}

/**
 * check if the game ended
 * @returns {boolean} true if the game ended, false otherwise
 */
function checkGameEnded() {
    for (let i = 0; i < lobby.players.length; i++) {
        if (lobby.players[i].height >= 10) {
            return true;
        }
    }
    return false;
}

/**
 * update the lobby with the choices of the players
 * and check if the game ended
 * if it did, send a message to the main thread
 */
function updateLobbyWithChoices() {
    sendUpdatedLobby();
    updatePlayersResources();
    gameEnded = checkGameEnded();
    if (gameEnded) {
        sendEndGame();
    } else {
        console.log(lobby.players);
    }
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
        lobby: lobbyId,
        winner: lobby.players.reduce((prev, curr) => {
            return prev.height > curr.height ? prev : curr;
        }).id,
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
            initializeLobby(event.data.players, event.data.lobbyId);
            break;
        case 'pick':
            lobby.players.find(player => player.id === event.data.player).pick = event.data.choice;
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
        await new Promise(resolve => setTimeout(resolve, 5000));
        sendChoices();
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