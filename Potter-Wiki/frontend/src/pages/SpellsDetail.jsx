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
      <section className="min-h-screen pt-[160px] flex flex-col items-center justify-start px-4">
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
          <div className="flex justify-center items-center gap-4 mt-10 flex-wrap">
            <button
              onClick={() => navigate("/spells")}
              className="px-6 py-2 bg-[#cfae6d] hover:bg-[#e0c98c] text-black font-semibold rounded-lg shadow-md transition"
            >
              ← Back
            </button>

            <button
              onClick={() => prevSpell && navigate(`/spells/${prevSpell._id}`)}
              disabled={!prevSpell}
              className={`px-6 py-2 font-semibold rounded-lg shadow-md transition ${
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
              className={`px-6 py-2 font-semibold rounded-lg shadow-md transition ${
                nextSpell
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
};

export default SpellsDetail;