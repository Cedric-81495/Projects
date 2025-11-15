import mongoose from "mongoose";
const { Schema } = mongoose;

const movieSchema = new Schema(
  { 
    potterdbId: { type: String, unique: true,  index: true,},
    type: { type: String, default: "movie" },
    slug: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String },
    poster: { type: String },
    trailer: { type: String },
    wiki: { type: String },
    box_office: { type: String },
    budget: { type: String },
    rating: { type: String },
    release_date: { type: String },
    running_time: { type: String },
    cinematographers: [{ type: String }],
    directors: [{ type: String }],
    distributors: [{ type: String }],
    editors: [{ type: String }],
    music_composers: [{ type: String }],
    producers: [{ type: String }],
    screenwriters: [{ type: String }],
  },
  { timestamps: true }
);


movieSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Movie", movieSchema);
