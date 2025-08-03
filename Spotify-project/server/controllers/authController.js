// server/controllers/authController.js

const User = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { refreshAccessToken } = require('../utils/tokenRefresh');

exports.handleCallback = async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;

    // Get user profile from Spotify
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userData = userResponse.data;

    // Check if user exists
    let user = await User.findOne({ spotifyId: userData.id });

    if (user) {
      // Update existing user
      user.accessToken = access_token;
      user.refreshToken = refresh_token;
      user.tokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour
    } else {
      // Create new user
      user = new User({
        spotifyId: userData.id,
        email: userData.email,
        displayName: userData.display_name,
        profileUrl: userData.images[0]?.url || '',
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry: new Date(Date.now() + 3600 * 1000)
      });
    }

    await user.save();

    // 🔐 Create JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        spotifyId: user.spotifyId,
        displayName: user.displayName,
        email: user.email,
        profileUrl: user.profileUrl
      }
    });

  } catch (error) {
    console.error('Auth callback error:', error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { accessToken, expiresIn } = await refreshAccessToken(refreshToken);

    res.status(200).json({
      access_token: accessToken,
      expires_in: expiresIn
    });

  } catch (error) {
    console.error('Token refresh error:', error.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};