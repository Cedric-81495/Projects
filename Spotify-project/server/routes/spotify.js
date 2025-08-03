// server/routes/spotify.js

import express from 'express';
import axios from 'axios';
import verifyToken from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Helper: throw if access token is missing
const getUserAccessToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.accessToken) {
    const error = new Error('Spotify access token not found');
    error.statusCode = 401;
    throw error;
  }
  return user.accessToken;
};

// Get user's Spotify profile
router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const accessToken = await getUserAccessToken(req.user.userId);

    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    res.json(response.data);
  } catch (error) {
    next(error); // Pass to centralized error handler
  }
});

// Get user's top artists
router.get('/top-artists', verifyToken, async (req, res, next) => {
  try {
    const accessToken = await getUserAccessToken(req.user.userId);

    const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        time_range: req.query.time_range || 'medium_term',
        limit: req.query.limit || 20,
        offset: req.query.offset || 0
      }
    });

    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get user's top tracks
router.get('/top-tracks', verifyToken, async (req, res, next) => {
  try {
    const accessToken = await getUserAccessToken(req.user.userId);

    const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        time_range: req.query.time_range || 'medium_term',
        limit: req.query.limit || 20,
        offset: req.query.offset || 0
      }
    });

    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get user's playlists
router.get('/playlists', verifyToken, async (req, res, next) => {
  try {
    const accessToken = await getUserAccessToken(req.user.userId);

    const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        limit: req.query.limit || 20,
        offset: req.query.offset || 0
      }
    });

    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;
