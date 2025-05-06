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

// Get userId from username
async function getUserIdFromUsername(username) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/by-username?username=${username}`);
        return response.data.id;  // The userId will be inside response.data.id
    } catch (error) {
        console.error("Error fetching userId from username:", error.message);
        throw error;  // Rethrow the error to be handled by the route
    }
}

// API endpoint to fetch gamepasses for a username
app.get('/gamepasses', async (req, res) => {
    const username = req.query.username;

    if (!username) {
        return res.status(400).send('Missing username in query.');
    }

    console.log('Fetching gamepasses for username:', username);

    try {
        const userId = await getUserIdFromUsername(username);
        const gamepasses = await fetchAllGamepasses(userId);

        res.json({
            username,
            gamepasses
        });
    } catch (error) {
        res.status(500).send('Error fetching gamepasses');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
