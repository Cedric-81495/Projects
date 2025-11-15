import { Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import api from "../lib/axios";
import { AuthContext } from "../context/AuthProvider";
import PageWrapper from "../components/PageWrapper";

const SuggestionsPage = () => {
  const { user } = useContext(AuthContext);
  const [suggestions, setSuggestions] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyMap, setReplyMap] = useState({});
  const [editingMap, setEditingMap] = useState({});

  const isAdmin = user?.role === "adminUser" || user?.role === "superUser";
  const isPublicUser = user?.role === "publicUser";
  const hasPosted = suggestions.some((s) => s.user === user?._id);

  useEffect(() => {
    if (!user) return;
    const fetchSuggestions = async () => {
      try {
        const res = await api.get("/suggestions");
        setSuggestions(res.data);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/suggestions", { content });
      setContent("");
      const res = await api.get("/suggestions");
      setSuggestions(res.data);
    } catch (err) {
      console.error("Failed to submit suggestion:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/suggestions/${id}`);
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Failed to delete suggestion:", err);
    }
  };

  const startEditing = (s) => {
    setEditingMap((prev) => ({
      ...prev,
      [s._id]: { content: s.content },
    }));
  };

  const cancelEditing = (id) => {
    setEditingMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleEditChange = (id, field, value) => {
    setEditingMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleEditSubmit = async (id) => {
    try {
      await api.put(`/suggestions/${id}`, editingMap[id]);
      const res = await api.get("/suggestions");
      setSuggestions(res.data);
      cancelEditing(id);
    } catch (err) {
      console.error("Failed to update suggestion:", err);
    }
  };

  const handleReplyChange = (id, message) => {
    setReplyMap((prev) => ({ ...prev, [id]: message }));
  };

  const handleReplySubmit = async (id) => {
    try {
      await api.post(`/suggestions/${id}/reply`, { message: replyMap[id] });
      const res = await api.get("/suggestions");
      setSuggestions(res.data);
      setReplyMap((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("Failed to submit reply:", err);
    }
  };

  if (!user) {
    return (
      <PageWrapper>
        <div className="text-center py-20 text-gray-600 space-y-6">
          <p>Please log in with your Gmail account to view and post suggestions.</p>
          <div className="w-full max-w-xs mx-auto">
            <Link
              to="/login"
              className="block bg-amber-700 hover:bg-amber-800 text-white text-center px-4 py-2 rounded transition"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper loading={loading}>
      <section className="min-h-screen flex flex-col md:flex-row gap-6 px-4 pt-6 w-full max-w-7xl mx-auto">
        {/* 📝 Suggestion Form (only for publicUser who hasn't posted) */}
        {isPublicUser && hasPosted && (
          <div className="w-full md:w-1/4">
            <h2 className="text-xl font-bold mb-4">Submit a Suggestion</h2>
            <form onSubmit={handleSubmit} className="space-y-4 border border-black rounded-lg p-4 bg-white shadow">
          
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Content"
                className="w-full p-2 border border-black rounded text-black bg-white placeholder-gray-500 h-32"
              />
              <button
                type="submit"
                className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded w-full"
              >
                Submit Suggestion
              </button>
            </form>
          </div>
        )}

        {/* 📋 Suggestions List */}
        <div className="w-full md:w-3/4 space-y-6 mb-5">
          <h2 className="text-xl text-black font-bold mb-4">All Suggestions</h2>
          {suggestions.map((s) => {
            const isOwner = s.user === user?._id;
            const isEditing = editingMap[s._id];

            return (
              <div key={s._id} className="border p-4 rounded shadow-sm bg-white">
                {isEditing ? (
                  <>
                  
                    <textarea
                      value={editingMap[s._id].content}
                      onChange={(e) => handleEditChange(s._id, "content", e.target.value)}
                      className="w-full p-2 border border-black rounded text-black bg-white h-24 mb-2"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleEditSubmit(s._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => cancelEditing(s._id)}
                        className="text-gray-600 hover:underline text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-gray-700">{s.content}</p>

                      {isPublicUser && s.user === user?._id && (
                        <p className="text-sm text-gray-500 mt-1">
                          You posted on:{" "}
                          <span className="font-medium">
                            {new Date(s.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}{" "}
                            at{" "}
                            {new Date(s.createdAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true
                            })}
                          </span>
                        </p>
                      )}

              

                    {(isAdmin && s.user) && (
                      <p className="text-sm text-gray-500 mt-1">
                        Posted by:{" "}
                        <span className="font-medium">
                          {s.user.firstname || "Unknown"}
                        </span>{" "}
                        <br/>Date: {" "}
                        <span className="font-medium">
                          {new Date(s.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </span>
                      </p>
                    )}

                    {s.replies?.length > 0 && (
                      <div className="mt-4 border-t pt-2">
                        <h4 className="text-sm font-bold text-gray-600">Admin Replies:</h4>
                        {s.replies.map((r, i) => (
                          <p key={i} className="text-sm text-gray-800 mt-1">— {r.message}</p>
                        ))}
                      </div>
                    )}

                    {isOwner && (
                      <div className="mt-4 flex gap-4">
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => startEditing(s)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="mt-4 border-t pt-4 space-y-2">
                        <textarea
                          value={replyMap[s._id] || ""}
                          onChange={(e) => handleReplyChange(s._id, e.target.value)}
                          placeholder="Write a reply..."
                          className="w-full p-2 border border-gray-300 rounded text-black bg-white h-20"
                        />
                        <button
                          onClick={() => handleReplySubmit(s._id)}
                                           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                        >
                          Submit Reply
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </PageWrapper>
  );
};

export default SuggestionsPage;