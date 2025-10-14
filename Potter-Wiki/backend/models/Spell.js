import mongoose from "mongoose";

const spellSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
}, { timestamps: true });

export default mongoose.model("Spell", spellSchema);
