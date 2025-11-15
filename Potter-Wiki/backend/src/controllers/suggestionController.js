import Suggestion from "../models/Suggestion.js";

export const createSuggestion = async (req, res) => {
  const { content } = req.body;
  const suggestion = new Suggestion({ user: req.user._id, content });
  await suggestion.save();
  res.status(201).json(suggestion);
};

export const getUserSuggestions = async (req, res) => {

  
  if (!req.user) {
    res.status(401);
    throw new Error("User not authenticated");
  }

  let suggestions;

  if (req.user.role === "adminUser" || req.user.role === "superUser") {
    // Admins see all suggestions with user info
    suggestions = await Suggestion.find().populate("user", "firstname email");
  } else {
    // Public users see only their own suggestions
    suggestions = await Suggestion.find({ user: req.user._id });
  }

  res.status(200).json(suggestions);
};

export const updateSuggestion = async (req, res) => {
  const suggestion = await Suggestion.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  );
  res.json(suggestion);
};

export const deleteSuggestion = async (req, res) => {
  await Suggestion.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ message: "Deleted" });
};