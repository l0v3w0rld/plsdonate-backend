const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

// Fetch userId from a username (this will be similar to how it was done for the claim booth)
async function fetchUserIdFromUsername(username) {
  try {
    const response = await axios.get(`https://api.roblox.com/users/get-by-username?username=${username}`);
    return response.data.Id;
  } catch (error) {
    console.error(`Error fetching userId for username ${username}:`, error.message);
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

// API endpoint for fetching gamepasses
app.get('/gamepasses', async (req, res) => {
    const { userId, username } = req.query;
    let userIdToFetch;

    // Check if username is provided, then fetch userId
    if (username) {
        userIdToFetch = await fetchUserIdFromUsername(username);
        if (!userIdToFetch) {
            return res.status(400).send('Invalid username or unable to fetch userId.');
        }
    } else if (userId) {
        userIdToFetch = userId; // Use the provided userId directly
    } else {
        return res.status(400).send('Please provide either a userId or a username.');
    }

    console.log('Fetching all gamepasses for userId:', userIdToFetch);

    const gamepasses = await fetchAllGamepasses(userIdToFetch);

    res.json({
        userId: userIdToFetch,
        gamepasses
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
