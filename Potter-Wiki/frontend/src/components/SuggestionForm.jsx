import { useState } from "react";
import api from "../lib/axios"; 

export default function SuggestionForm({ onSubmit }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/suggestions", { title, content });
    onSubmit();
    setTitle("");
    setContent("");
  };

  return (
   <form
      onSubmit={handleSubmit}
      className="space-y-4 border border-black rounded-lg p-6 bg-white shadow-md max-w-xl w-full"
    >
        <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full p-2 border border-black text-black bg-white placeholder-gray-500 rounded"
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content"
        className="w-full p-2 border border-black text-black bg-white placeholder-gray-500 rounded h-32"
      />

      <button
        type="submit"
        className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded"
      >
        Submit
      </button>
    </form>
  );
}