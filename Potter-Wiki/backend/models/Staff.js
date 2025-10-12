// backend/models/Staff.js
import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  species: { type: String },
  gender: { type: String },
  house: { type: String },
  dateOfBirth: { type: String },
  yearOfBirth: { type: Number },
  ancestry: { type: String },
  eyeColour: { type: String },
  hairColour: { type: String },
  wand: {
    wood: { type: String },
    core: { type: String },
    length: { type: Number },
  },
  patronus: { type: String },
  hogwartsStaff: { type: Boolean },
  actor: { type: String },
  alive: { type: Boolean },
  image: { type: String },
});

const Staff = mongoose.model("Staff", staffSchema);
export default Staff;
