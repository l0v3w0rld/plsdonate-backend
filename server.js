const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

// Fetch the userId from a username
async function getUserIdFromUsername(username) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/search?keyword=${username}`, {
            headers: {
                Cookie: `.ROBLOSECURITY=${ROBLOX_COOKIE}`
            }
        });
        if (response.data.data && response.data.data.length > 0) {
            return response.data.data[0].id; // Return the userId for the username
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('Error fetching userId from username:', error.message);
        return null;
    }
}

// Fetch all games made by a user
async function fetchUserGames(userId) {
    try {
        const response = await axios.get(`https://games.roblox.com/v2/users/${userId}/games?sortOrder=Asc&limit=50`, {
            headers: {
                Cookie: `.ROBLOSECURITY=${ROBLOX_COOKIE}`
            }
        });
        return response.data.data; // Array of games
    } catch (error) {
        console.error('Error fetching user games:', error.message);
        return [];
    }
}

// Fetch all gamepasses for a game
async function fetchGamepassesForGame(gameId) {
    try {
        const response = await axios.get(`https://games.roblox.com/v1/games/${gameId}/game-passes?limit=50`, {
            headers: {
                Cookie: `.ROBLOSECURITY=${ROBLOX_COOKIE}`
            }
        });
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
        finalUserId = await getUserIdFromUsername(username);
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
