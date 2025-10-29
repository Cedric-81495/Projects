// backend\seder.js
import dotenv from "dotenv";
import axios from "axios";
import connectDB from "./config/db.js";
import Character from "./models/Character.js";
import Spell from "./models/Spell.js";
import Student from "./models/Student.js";
import Staff from "./models/Staff.js";

dotenv.config();

const importData = async () => {
  try {
    await connectDB();

    // --- Characters ---
    const { data: characters } = await axios.get("https://hp-api.onrender.com/api/characters");
    let updatedCount = 0, newCount = 0;
    for (const char of characters) {
      const result = await Character.findOneAndUpdate(
        { name: char.name }, // Match by unique field
        char,
        { upsert: true, new: true }
      );
      if (result.isNew) newCount++;
      else updatedCount++;
    }

    // --- Spells ---
    const { data: spells } = await axios.get("https://hp-api.onrender.com/api/spells");
    let spellUpdated = 0, spellNew = 0;
    for (const spell of spells) {
      const result = await Spell.findOneAndUpdate(
        { name: spell.name },
        spell,
        { upsert: true, new: true }
      );
      if (result.isNew) spellNew++;
      else spellUpdated++;
    }

    // --- Students ---
    const { data: students } = await axios.get("https://hp-api.onrender.com/api/characters/students");
    let studentUpdated = 0, studentNew = 0;
    for (const student of students) {
      const result = await Student.findOneAndUpdate(
        { name: student.name },
        student,
        { upsert: true, new: true }
      );
      if (result.isNew) studentNew++;
      else studentUpdated++;
    }

    // --- Staff ---
    const { data: staff } = await axios.get("https://hp-api.onrender.com/api/characters/staff");
    let staffUpdated = 0, staffNew = 0;
    for (const s of staff) {
      const result = await Staff.findOneAndUpdate(
        { name: s.name },
        s,
        { upsert: true, new: true }
      );
      if (result.isNew) staffNew++;
      else staffUpdated++;
    }

    console.log("✅ Data Import Complete (Safe Mode)");
    console.log(`📚 Characters → Updated: ${updatedCount}, New: ${newCount}`);
    console.log(`✨ Spells → Updated: ${spellUpdated}, New: ${spellNew}`);
    console.log(`🎓 Students → Updated: ${studentUpdated}, New: ${studentNew}`);
    console.log(`🏫 Staff → Updated: ${staffUpdated}, New: ${staffNew}`);

    process.exit();
  } catch (err) {
    console.error("❌ Import Error:", err.message);
    process.exit(1);
  }
};

importData();
