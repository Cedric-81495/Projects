import mongoose from "mongoose";

const spellSchema = new mongoose.Schema({
  externalId: { type: String, unique: true, index: true },
  name: { type: String },
  description: { type: String },
}, { timestamps: true });

export default mongoose.model("Spell", spellSchema);
