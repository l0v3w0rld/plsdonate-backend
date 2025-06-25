const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

// Middleware to parse JSON bodies
app.use(express.json());

// In-memory store for player stats: { playerName: { Raised: number, Donated: number } }
const playerStats = {};

// Fetch the userId from a username
async function getUserIdFromUsername(username) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/search?keyword=${username}`);
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

// API endpoint: fetch gamepasses by userId or username
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

// New: Endpoint to get global leaderboard (sorted by Raised descending)
app.get('/leaderboard', (req, res) => {
    const leaderboardArray = Object.entries(playerStats).map(([Name, stats]) => ({
        Name,
        Raised: stats.Raised || 0,
        Donated: stats.Donated || 0,
    }));

    leaderboardArray.sort((a, b) => b.Raised - a.Raised);

    res.json(leaderboardArray);
});

// New: Endpoint to update stats for a player (POST JSON: { Name, Raised, Donated })
app.post('/updateStats', (req, res) => {
    const { Name, Raised, Donated } = req.body;

    if (!Name || (Raised === undefined && Donated === undefined)) {
        return res.status(400).json({ error: 'Missing Name or stats' });
    }

    if (!playerStats[Name]) {
        playerStats[Name] = { Raised: 0, Donated: 0 };
    }

    if (typeof Raised === 'number') {
        playerStats[Name].Raised = Raised;
    }
    if (typeof Donated === 'number') {
        playerStats[Name].Donated = Donated;
    }

    res.json({ success: true, playerStats: playerStats[Name] });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
