// server/utils/checkAndRefreshToken.js
const User = require('../models/User');
const { refreshAccessToken } = require('./tokenRefresh');

/**
 * Checks if a user's access token is expired and refreshes it if needed.
 * Returns a valid access token ready for API calls.
 */
const checkAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const isExpired = !user.tokenExpiry || user.tokenExpiry < new Date();

  if (isExpired) {
    const { accessToken, expiresIn } = await refreshAccessToken(user.refreshToken);

    user.accessToken = accessToken;
    user.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    await user.save();

    return accessToken;
  }

  return user.accessToken;
};

module.exports = { checkAndRefreshToken };
