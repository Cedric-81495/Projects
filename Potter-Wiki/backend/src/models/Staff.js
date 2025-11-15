import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  externalId: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  alternate_names: [String],
  species: { type: String },
  gender: { type: String },
  house: { type: String },
  dateOfBirth: { type: String },
  yearOfBirth: { type: String }, // ✅ retained as String
  wizard: { type: Boolean },
  ancestry: { type: String },
  eyeColour: { type: String },
  hairColour: { type: String },
  wand: {
    wood: { type: String },
    core: { type: String },
    length: { type: Number },
  },
  patronus: { type: String },
  hogwartsStudent: { type: Boolean },
  hogwartsStaff: { type: Boolean },
  actor: { type: String },
  alternate_actors: [String],
  alive: { type: Boolean },
  image: { type: String },
}, { timestamps: true });

export default mongoose.model("Staff", staffSchema);