// src/pages/SpellsDetail.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import PageWrapper from "../components/PageWrapper";
import NotFound from "./NotFound";

const SpellsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [spell, setSpell] = useState(null);
  const [spells, setSpells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSpells = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/spells`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setSpells(res.data);

        const found = res.data.find((s) => s._id === id);
        setSpell(found);
        setError(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error("Failed to fetch spell:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSpells();
  }, [id, user]);

  const currentIndex = spells.findIndex((s) => s._id === id);
  const prevSpell = currentIndex > 0 ? spells[currentIndex - 1] : null;
  const nextSpell = currentIndex < spells.length - 1 ? spells[currentIndex + 1] : null;

  if (loading) return <PageWrapper loading={true} />;
  if (error || !spell)
    return (
      <PageWrapper>
        <NotFound message="Spell not found" />
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <div className="min-h-screen design-div flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        {/* Card */}
        <div className="bg-[#6b4ea0] text-white shadow-2xl rounded-2xl border border-amber-700 p-8 sm:p-10 w-full max-w-3xl">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 text-amber-200 font-serif text-center">
            {spell.name}
          </h2>

          <div className="space-y-3 text-base sm:text-lg leading-relaxed font-medium">
            <p>
              <span className="font-bold text-amber-300">Type:</span>{" "}
              {spell.type || "—"}
            </p>
            <p>
              <span className="font-bold text-amber-300">Effect:</span>{" "}
              {spell.effect || "—"}
            </p>
            <p>
              <span className="font-bold text-amber-300">Incantation:</span>{" "}
              <em>{spell.incantation || "—"}</em>
            </p>
            <p>
              <span className="font-bold text-amber-300">Light:</span>{" "}
              {spell.light || "Unknown"}
            </p>
            <p>
              <span className="font-bold text-amber-300">Creator:</span>{" "}
              {spell.creator || "Unknown"}
            </p>
            <p>
              <span className="font-bold text-amber-300">Description:</span>{" "}
              {spell.description || "No description available."}
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center items-center gap-4 mt-10 flex-wrap">
          <button
            onClick={() => navigate("/spells")}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow"
          >
            ← Back
          </button>
          <button
            onClick={() => prevSpell && navigate(`/spells/${prevSpell._id}`)}
            disabled={!prevSpell}
            className={`px-5 py-2 rounded-lg shadow ${
              prevSpell
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          >
            ← Prev
          </button>
          <button
            onClick={() => nextSpell && navigate(`/spells/${nextSpell._id}`)}
            disabled={!nextSpell}
            className={`px-5 py-2 rounded-lg shadow ${
              nextSpell
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          >
            Next →
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default SpellsDetail;
