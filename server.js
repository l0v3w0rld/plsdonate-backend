const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

// Fetch userId from username (using Roblox API)
async function fetchUserIdFromUsername(username) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/usernames/users`, {
            params: { usernames: [username] }
        });
        const user = response.data.data[0];
        return user ? user.id : null; // Return userId or null if not found
    } catch (error) {
        console.error('Error fetching userId from username:', error.message);
        return null;
    }
}

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
    const { userId, username } = req.query;

    let finalUserId = userId;

    // If username is provided, fetch userId from username
    if (username) {
        console.log('Fetching userId from username:', username);
        finalUserId = await fetchUserIdFromUsername(username);
        if (!finalUserId) {
            return res.status(400).send('Invalid username.');
        }
    }

    if (!finalUserId) {
        return res.status(400).send('Missing userId or username in query.');
    }

    console.log('Fetching all gamepasses for userId:', finalUserId);

    const gamepasses = await fetchAllGamepasses(finalUserId);

    res.json({
        userId: finalUserId,
        gamepasses
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

