import dotenv from "dotenv";
import axios from "axios";
import connectDB from "./config/db.js";
import Character from "./models/Character.js";
import Spell from "./models/Spell.js";
import Student from "./models/Student.js";
import Staff from "./models/Staff.js";
import Book from "./models/Book.js";
import Movie from "./models/Movie.js";

dotenv.config();

const importData = async () => {
  try {
    await connectDB();

    // ========================
    // --- MOVIES (PotterDB) ---
    // ========================
    console.log("🎬 Fetching movies from PotterDB...");
    const res = await axios.get("https://api.potterdb.com/v1/movies");
    const movies = res.data?.data || [];
    let movieUpdated = 0, movieNew = 0;

    for (const item of movies) {
      const attr = item.attributes || {};
      const movieData = {
        potterdbId: item.id, // ✅ Unique ID from PotterDB
        type: "movie",
        slug: attr.slug,
        title: attr.title,
        summary: attr.summary,
        poster: attr.poster,
        trailer: attr.trailer,
        wiki: attr.wiki,
        box_office: attr.box_office,
        budget: attr.budget,
        rating: attr.rating,
        release_date: attr.release_date,
        running_time: attr.running_time,
        cinematographers: attr.cinematographers || [],
        directors: attr.directors || [],
        distributors: attr.distributors || [],
        editors: attr.editors || [],
        music_composers: attr.music_composers || [],
        producers: attr.producers || [],
        screenwriters: attr.screenwriters || [],
      };

      const existing = await Movie.findOne({ potterdbId: item.id });
      if (existing) {
        await Movie.updateOne({ potterdbId: item.id }, movieData);
        movieUpdated++;
      } else {
        await Movie.create(movieData);
        movieNew++;
      }
    }

    console.log(`✅ Movies → Updated: ${movieUpdated}, New: ${movieNew}`);



    // ========================
    // --- BOOKS (PotterDB) ---
    // ========================
    console.log("📚 Fetching books from PotterDB...");
    const bookRes = await axios.get("https://api.potterdb.com/v1/books");
    const books = bookRes.data?.data || [];
    let bookUpdated = 0, bookNew = 0;

    for (const b of books) {
      const attrs = b.attributes || {};
      const rel = b.relationships || {};

      const bookData = {
        potterdbId: b.id,
        type: "book",
        attributes: {
          slug: attrs.slug,
          author: attrs.author,
          cover: attrs.cover,
          dedication: attrs.dedication,
          pages: attrs.pages,
          release_date: attrs.release_date,
          summary: attrs.summary,
          title: attrs.title,
          wiki: attrs.wiki,
        },
        relationships: {
          chapters: rel.chapters || { data: [] },
        },
      };

      const existingBook = await Book.findOne({ potterdbId: b.id });
      if (existingBook) {
        await Book.updateOne({ potterdbId: b.id }, bookData);
        bookUpdated++;
      } else {
        await Book.create(bookData);
        bookNew++;
      }
    }

    console.log(`✅ Books → Updated: ${bookUpdated}, New: ${bookNew}`);



    // ===========================
    // --- HP API (Characters etc.)
    // ===========================
    const makeExternalId = (prefix, obj) => {
      const base = `${prefix}-${obj.name || "unknown"}-${obj.actor || obj.house || ""}`;
      return base.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    };

    // --- Characters ---
    console.log("🧙 Fetching characters...");
    const charRes = await axios.get("https://hp-api.onrender.com/api/characters");
    const characters = charRes.data;
    let charUpdated = 0, charNew = 0;

    for (const data of characters) {
      const externalId = makeExternalId("char", data);
      const result = await Character.findOneAndUpdate(
        { externalId },
        { ...data, externalId },
        { upsert: true, new: true }
      );
      if (result.isNew) charNew++;
      else charUpdated++;
    }

    console.log(`✅ Characters → Updated: ${charUpdated}, New: ${charNew}`);



    // --- Spells ---
    console.log("✨ Fetching spells...");
    const spellRes = await axios.get("https://hp-api.onrender.com/api/spells");
    const spells = spellRes.data;
    let spellUpdated = 0, spellNew = 0;

    for (const data of spells) {
      const externalId = makeExternalId("spell", data);
      const result = await Spell.findOneAndUpdate(
        { externalId },
        { ...data, externalId },
        { upsert: true, new: true }
      );
      if (result.isNew) spellNew++;
      else spellUpdated++;
    }

    console.log(`✅ Spells → Updated: ${spellUpdated}, New: ${spellNew}`);



    // --- Students ---
    console.log("🎓 Fetching students...");
    const studentRes = await axios.get("https://hp-api.onrender.com/api/characters/students");
    const students = studentRes.data;   
    let studentUpdated = 0, studentNew = 0;

    for (const data of students) {
      const externalId = makeExternalId("student", data);
      const result = await Student.findOneAndUpdate(
        { externalId },
        { ...data, externalId },
        { upsert: true, new: true }
      );
      if (result.isNew) studentNew++;
      else studentUpdated++;
    }

    console.log(`✅ Students → Updated: ${studentUpdated}, New: ${studentNew}`);



    // --- Staff ---
    console.log("🏫 Fetching staff...");
    const staffRes = await axios.get("https://hp-api.onrender.com/api/characters/staff");
    const staffList = staffRes.data;
    let staffUpdated = 0, staffNew = 0;

    for (const data of staffList) {
      const externalId = makeExternalId("staff", data);
      const result = await Staff.findOneAndUpdate(
        { externalId },
        { ...data, externalId },
        { upsert: true, new: true }
      );
      if (result.isNew) staffNew++;
      else staffUpdated++;
    }

    console.log(`✅ Staff → Updated: ${staffUpdated}, New: ${staffNew}`);

    console.log("🎉 All Data Imported Safely Without Duplicates!");
    process.exit();

  } catch (err) {
    console.error("❌ Import Error:", err.message);
    process.exit(1);
  }
};

importData();
