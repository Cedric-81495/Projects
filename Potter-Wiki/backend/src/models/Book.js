// backend/models/Book.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const chapterSchema = new Schema({
  type: { type: String, default: "chapter" },
});

// Book schema
const bookSchema = new Schema(
  {
    type: { type: String, default: "book" },
    attributes: {
      slug: { type: String, required: true },
      author: { type: String, required: true },
      cover: { type: String },
      dedication: { type: String },
      pages: { type: Number },
      release_date: { type: Date },
      summary: { type: String },
      title: { type: String, required: true },
      wiki: { type: String },
    },
    relationships: {
      chapters: {
        data: [chapterSchema],
      },
    },
    links: {
      self: {
        type: String,
        default: function () {
          return `/v1/books/${this._id}`;
        },
      },
    },
  },
  { timestamps: true }
);

// Virtual field to expose `id` instead of `_id`
bookSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookSchema.set("toJSON", {
  virtuals: true,
});

export default mongoose.model("Book", bookSchema);
