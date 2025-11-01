import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    default: "movie",
  },
  slug: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  poster: {
    type: String,
    validate: {
      validator: (v) => /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/.test(v),
      message: "Invalid poster URL format",
    },
  },
  trailer: {
    type: String,
    validate: {
      validator: (v) => /^https?:\/\/.+/.test(v),
      message: "Invalid trailer URL format",
    },
  },
  wiki: {
    type: String,
    validate: {
      validator: (v) => /^https?:\/\/.+/.test(v),
      message: "Invalid wiki URL format",
    },
  },
  box_office: {
    type: String,
    trim: true,
  },
  budget: {
    type: String,
    trim: true,
  },
  rating: {
    type: String,
    trim: true,
  },
  release_date: {
    type: Date,
  },
  running_time: {
    type: String,
    trim: true,
  },
  cinematographers: [String],
  directors: [String],
  distributors: [String],
  editors: [String],
  music_composers: [String],
  producers: [String],
  screenwriters: [String],
  links: {
    self: {
      type: String,
      required: true,
    },
  },
}, {
  timestamps: true,
});

export default mongoose.model("Movie", movieSchema);