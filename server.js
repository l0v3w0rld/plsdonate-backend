const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Function to fetch user ID by username
async function getUserIdFromUsername(username) {
  try {
    const response = await axios.get(`https://users.roblox.com/v1/usernames/users`, {
      params: { usernames: [username] }
    });

    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0].id;
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching userId from username:', error.message);
    throw error;
  }
}

// Fetch all games made by a user
async function fetchUserGames(userId) {
  try {
    const response = await axios.get(`https://games.roblox.com/v2/users/${userId}/games?sortOrder=Asc&limit=50`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user games:', error.message);
    return [];
  }
}

// Fetch all gamepasses for a game
async function fetchGamepassesForGame(gameId) {
  try {
    const response = await axios.get(`https://games.roblox.com/v1/games/${gameId}/game-passes?limit=50`);
    return response.data.data;
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

// New endpoint to fetch gamepasses by username
app.get('/gamepasses', async (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).send('No username provided');
  }

  try {
    // Fetch userId from username
    const userId = await getUserIdFromUsername(username);

    console.log('Fetching all gamepasses for username:', username);

    // Fetch all gamepasses for that userId
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
