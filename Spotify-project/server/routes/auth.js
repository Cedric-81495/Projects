// server/routes/auth.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const frontend_uri = process.env.FRONTEND_URI;

// Step 1: Redirect to Spotify login
router.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email user-top-read';
  const query = querystring.stringify({
    response_type: 'code',
    client_id,
    scope,
    redirect_uri,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${query}`);
});

// Step 2: Handle Spotify callback
router.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id,
        client_secret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token } = response.data;

    // OPTIONAL: redirect to frontend with tokens (not secure for prod)
    res.redirect(`${frontend_uri}/?access_token=${access_token}&refresh_token=${refresh_token}`);
  } catch (err) {
    console.error('Error exchanging code:', err.response?.data || err.message);
    res.redirect(`${frontend_uri}/?error=auth_failed`);
  }
});

module.exports = router;
