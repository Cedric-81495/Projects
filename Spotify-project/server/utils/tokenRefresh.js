// server/utils/tokenRefresh.js
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

module.exports = { refreshAccessToken };