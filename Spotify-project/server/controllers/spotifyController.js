// server/controllers/spotifyController.js
const axios = require('axios');
const { checkAndRefreshToken } = require('../utils/checkAndRefreshToken');

exports.getUserPlaylists = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you're using auth middleware
    const accessToken = await checkAndRefreshToken(userId);

    const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error fetching playlists:', err.message);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
};
