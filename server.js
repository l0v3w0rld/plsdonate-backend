const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

// Fetch all games made by a user
async function fetchUserGames(userId) {
    try {
        const response = await axios.get(`https://games.roblox.com/v2/users/${userId}/games?sortOrder=Asc&limit=50`);
        return response.data.data; // Array of games
    } catch (error) {
        console.error('Error fetching user games:', error.message);
        return [];
    }
}

// Fetch all gamepasses for a game
async function fetchGamepassesForGame(gameId) {
    try {
        const response = await axios.get(`https://games.roblox.com/v1/games/${gameId}/game-passes?limit=50`);
        return response.data.data; // Array of gamepasses
    } catch (error) {
        console.error(`Error fetching gamepasses for game ${gameId}:`, error.message);
        return [];
    }
}

// Full fetch of all gamepasses for a user
async function fetchAllGamepasses(userId) {
    const games = await fetchUserGames(userId);
    let allGamepasses = [];

    for (const game of games) {
        const passes = await fetchGamepassesForGame(game.id);
        allGamepasses = allGamepasses.concat(passes);
    }

    return allGamepasses;
}

// API endpoint
app.get('/', async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).send('Missing userId in query.');
    }

    console.log('Fetching all gamepasses for userId:', userId);

    const gamepasses = await fetchAllGamepasses(userId);

    res.json({
        userId,
        gamepasses
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
