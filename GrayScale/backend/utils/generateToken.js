const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      user: {
        id: user._id,
        role: user.role,
      },
    },
    process.env.JWT_SECRET,
    { expiresIn: "5h" }
  );
};

module.exports = generateToken;
