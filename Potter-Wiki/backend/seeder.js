import mongoose from "mongoose";
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
    await Character.deleteMany();
    const insertedCharacters = await Character.insertMany(characters);

     --- Spells ---
    const { data: spells } = await axios.get("https://hp-api.onrender.com/api/spells");
    await Spell.deleteMany();
    const insertedSpells = await Spell.insertMany(spells);

    // --- Students ---
    const { data: students } = await axios.get("https://hp-api.onrender.com/api/characters/students");
    await Student.deleteMany();
    const insertedStudents = await Student.insertMany(students);

    // --- Staff ---
    const { data: staff } = await axios.get("https://hp-api.onrender.com/api/characters/staff");
    await Staff.deleteMany();
    const insertedStaff = await Staff.insertMany(staff);

    console.log("✅ Data Imported!");
    console.log(`📚 Characters: ${insertedCharacters.length}`);
    console.log(`✨ Spells: ${insertedSpells.length}`);
    console.log(`🎓 Students: ${insertedStudents.length}`);
    console.log(`🏫 Staff: ${insertedStaff.length}`);

    process.exit();
  } catch (err) {
    console.error("❌ Import Error:", err.message);
    process.exit(1);
  }
};

importData();
