import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthProvider";
import PageWrapper from "../components/PageWrapper";
import NotFound from "../components/NotFound";

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
        const res = await axios.get("/api/spells");
        setSpells(res.data);
        console.log("Fetched Spells:", res.data);
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
    <section className="min-h-screen pt-[190px] md:pt-[300px]  flex flex-col items-center justify-start px-4 bg-white text-black">
      <div className="w-full max-w-6xl mx-auto">

       
      {/* 📜 Spell Card */}
<div className="bg-white border border-black text-black shadow-md hover:shadow-xl transition duration-300 p-3 sm:p-5 font-serif flex flex-col gap-8">

          {/* 🪄 Spell Name */}
          <h2 className="text-4xl sm:text-5xl font-bold text-center sm:text-left text-black border-b border-gray-300 pb-4">
            {spell.name}
          </h2>

        {/* 🧾 Spell Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-base md:text-lg leading-relaxed">
          <p><span className="font-semibold">Type:</span> {spell.type || "—"}</p>
          <p><span className="font-semibold">Effect:</span> {spell.effect || "—"}</p>
          <p><span className="font-semibold">Incantation:</span> <em>{spell.incantation || "—"}</em></p>
          <p><span className="font-semibold">Light:</span> {spell.light || "Unknown"}</p>
          <p><span className="font-semibold">Creator:</span> {spell.creator || "Unknown"}</p>
          <p className="md:col-span-2"><span className="font-semibold">Description:</span> {spell.description || "No description available."}</p>
        </div>
      </div>

        {/* 🧭 Navigation Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10 w-full max-w-xl mx-auto px-4 font-serif mb-6">
          {/* ← Prev */}
          <button
            onClick={() => prevSpell && navigate(`/spells/${prevSpell._id}`)}
            disabled={!prevSpell}
            className={`w-full px-6 py-3 border border-black shadow-sm transition-all duration-300 tracking-wide ${
              prevSpell
                ? "bg-white text-black hover:bg-gray-50"
                : "bg-white text-gray-400 border-gray-300 cursor-not-allowed"
            }`}
          >
            ← Prev
          </button>

          {/* Next → */}
          <button
            onClick={() => nextSpell && navigate(`/spells/${nextSpell._id}`)}
            disabled={!nextSpell}
            className={`w-full px-6 py-3 border border-black shadow-sm transition-all duration-300 tracking-wide ${
              nextSpell
                ? "bg-white text-black hover:bg-gray-50"
                : "bg-white text-gray-400 border-gray-300 cursor-not-allowed"
            }`}
          >
            Next →
          </button>

          {/* ← Back */}
          <button
            onClick={() => navigate("/spells")}
             className="w-full px-6 py-3 border border-black text-white bg-black hover:bg-white hover:text-black shadow-md hover:shadow-lg transition-all duration-300 tracking-wide col-span-2 md:col-span-1"
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