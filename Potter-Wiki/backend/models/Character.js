import mongoose from "mongoose";

const characterSchema = new mongoose.Schema({
  name: { type: String },
  species: { type: String },
  gender: { type: String },
  house: { type: String },
  dateOfBirth: { type: String },
  ancestry: { type: String },
  eyeColour: { type: String },
  hairColour: { type: String },
  wand: {
    wood: { type: String },
    core: { type: String },
    length: Number,
  },
  patronus: { type: String },
  actor: { type: String },
  alive: Boolean,
  image: { type: String },
}, { timestamps: true });

export default mongoose.model("Character", characterSchema);
