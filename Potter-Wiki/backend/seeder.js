// backend/seeder.js
import dotenv from "dotenv";
import axios from "axios";
import connectDB from "./config/db.js";
import Character from "./models/Character.js";
import Spell from "./models/Spell.js";
import Student from "./models/Student.js";
import Staff from "./models/Staff.js";
import Book from "./models/Book.js";

dotenv.config();

const importData = async () => {
  try {
    await connectDB();

    // --- Books ---
    const bookRes = await axios.get("https://api.potterdb.com/v1/books");
    const books = bookRes.data.data;
    let bookUpdated = 0, bookNew = 0;

    for (const book of books) {
      const result = await Book.findOneAndUpdate(
        { "attributes.slug": book.attributes.slug },
        book,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      if (result.wasNew) bookNew++;
      else bookUpdated++;
    }

    // --- Characters ---
    const charRes = await axios.get("https://hp-api.onrender.com/api/characters");
    const characters = charRes.data;
    let charUpdated = 0, charNew = 0;

    for (const data of characters) {
      const result = await Character.findOneAndUpdate(
        { name: data.name },
        data,
        { upsert: true, new: true }
      );
      if (result.isNew) charNew++;
      else charUpdated++;
    }

    // --- Spells ---
    const spellRes = await axios.get("https://hp-api.onrender.com/api/spells");
    const spells = spellRes.data;
    let spellUpdated = 0, spellNew = 0;

    for (const data of spells) {
      const result = await Spell.findOneAndUpdate(
        { name: data.name },
        data,
        { upsert: true, new: true }
      );
      if (result.isNew) spellNew++;
      else spellUpdated++;
    }

    // --- Students ---
    const studentRes = await axios.get("https://hp-api.onrender.com/api/students");
    const students = studentRes.data;
    let studentUpdated = 0, studentNew = 0;

    for (const data of students) {
      const result = await Student.findOneAndUpdate(
        { name: data.name },
        data,
        { upsert: true, new: true }
      );
      if (result.isNew) studentNew++;
      else studentUpdated++;
    }

    // --- Staff ---
    const staffRes = await axios.get("https://hp-api.onrender.com/api/staff");
    const staffList = staffRes.data;
    let staffUpdated = 0, staffNew = 0;

    for (const data of staffList) {
      const result = await Staff.findOneAndUpdate(
        { name: data.name },
        data,
        { upsert: true, new: true }
      );
      if (result.isNew) staffNew++;
      else staffUpdated++;
    }

    console.log("✅ Data Import Complete (Safe Mode)");
    console.log(`📚 Books → Updated: ${bookUpdated}, New: ${bookNew}`);
    console.log(`🧙 Characters → Updated: ${charUpdated}, New: ${charNew}`);
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