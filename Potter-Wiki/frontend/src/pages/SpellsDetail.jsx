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
        <NotFound message="Spell not found" backPath="/spells" />
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <section className="min-h-screen pt-[180px] flex flex-col items-center justify-start px-4">
        <div className="w-full max-w-6xl mx-auto">
          {/* 🪄 Spell Name */}
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#f5e6c8] mb-10 text-center">
            {spell.name}
          </h2>

          {/* 📜 Spell Card */}
          <div className="bg-[#1b1b2f] border border-[#cfae6d] text-[#f5e6c8] shadow-md hover:shadow-xl transition duration-300 rounded-2xl p-6 sm:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-base sm:text-lg font-medium leading-relaxed">
              <p><span className="text-[#cfae6d] font-semibold">Type:</span> {spell.type || "—"}</p>
              <p><span className="text-[#cfae6d] font-semibold">Effect:</span> {spell.effect || "—"}</p>
              <p><span className="text-[#cfae6d] font-semibold">Incantation:</span> <em>{spell.incantation || "—"}</em></p>
              <p><span className="text-[#cfae6d] font-semibold">Light:</span> {spell.light || "Unknown"}</p>
              <p><span className="text-[#cfae6d] font-semibold">Creator:</span> {spell.creator || "Unknown"}</p>
              <p className="sm:col-span-2"><span className="text-[#cfae6d] font-semibold">Description:</span> {spell.description || "No description available."}</p>
            </div>
          </div>

 {/* 🧭 Navigation Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10 w-full max-w-xl mx-auto px-4 font-serif">
            {/* ← Prev */}
            <button
              onClick={() => prevSpell && navigate(`/spells/${prevSpell._id}`)}
              disabled={!prevSpell}
              className={`w-full px-6 py-3 rounded-md border border-amber-400 shadow-md transition-all duration-300 tracking-wide ${
                prevSpell
                  ? "bg-gradient-to-r from-indigo-900 via-indigo-700 to-indigo-900 text-amber-200 hover:from-indigo-700 hover:to-indigo-800"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              ← Prev
            </button>

            {/* Next → */}
            <button
              onClick={() => nextSpell && navigate(`/spells/${nextSpell._id}`)}
              disabled={!nextSpell}
              className={`w-full px-6 py-3 rounded-md border border-amber-400 shadow-md transition-all duration-300 tracking-wide ${
                nextSpell
                  ? "bg-gradient-to-r from-indigo-900 via-indigo-700 to-indigo-900 text-amber-200 hover:from-indigo-700 hover:to-indigo-800"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              Next →
            </button>

            {/* ← Back */}
            <button
              onClick={() => navigate("/spells")}
              className="w-full px-6 py-3 rounded-md border border-amber-400 text-amber-200 bg-gradient-to-r from-[#5c3b00] via-[#8b5e00] to-[#5c3b00] hover:from-[#7a4a00] hover:to-[#a86f00] shadow-md hover:shadow-lg transition-all duration-300 tracking-wide col-span-2 md:col-span-1"
            >
              ← Back
            </button>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
};

export default SpellsDetail;