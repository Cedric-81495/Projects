// backend\seder.js
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
    const books = await axios.get("https://api.potterdb.com/v1/books");
    const char = books.data.data;  
    let bookUpdated = 0, bookNew = 0;

    for (const book of char) {
      const existingBook = await Book.findOneAndUpdate(
        { "attributes.slug": book.attributes.slug },
        char,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (existingBook.wasNew) bookNew++;
      else bookUpdated++;
    }

    // --- Characters ---
    const characters = await axios.get("https://hp-api.onrender.com/api/characters");
    const char = characters.data.data; 
    let updatedCount = 0, newCount = 0;

    for (const data of char) {
      const result = await Character.findOneAndUpdate(
        { name: data.name }, 
        data,
        { upsert: true, new: true }
      );
      if (result.isNew) newCount++;
      else updatedCount++;
    }

    // --- Spells ---
    const spells = await axios.get("https://hp-api.onrender.com/api/spells");
    const char = spells.data.data; 
    let updatedCount = 0, newCount = 0;

    for (const data of char) {
      const result = await Spells.findOneAndUpdate(
        { name: data.name },
        data,
        { upsert: true, new: true }
      );
      if (result.isNew) newCount++;
      else updatedCount++;
    }

    // --- Students ---
    const students = await axios.get("https://hp-api.onrender.com/api/students");
    const char = students.data.data;   
    let updatedCount = 0, newCount = 0;

    for (const data of char) {
      const result = await Students.findOneAndUpdate(
        { name: data.name }, 
        data,
        { upsert: true, new: true }
      );
      if (result.isNew) newCount++;
      else updatedCount++;
    }

    // --- Staff ---
    const staffs = await axios.get("https://hp-api.onrender.com/api/staff");
    const char = staffs.data.data;   
    let updatedCount = 0, newCount = 0;

    for (const data of char) {
      const result = await Staffs.findOneAndUpdate(
        { name: data.name }, 
        data,
        { upsert: true, new: true }
      );
      if (result.isNew) newCount++;
      else updatedCount++;
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
