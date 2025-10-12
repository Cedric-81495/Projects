import mongoose from "mongoose";

const spellSchema = new mongoose.Schema({
  name: String,
  description: String,
}, { timestamps: true });

export default mongoose.model("Spell", spellSchema);
