import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import PageWrapper from "../components/PageWrapper";

const SpellsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [spell, setSpell] = useState(null);
  const [spells, setSpells] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpells = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/spells", {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setSpells(res.data);

        const found = res.data.find((spell) => spell._id === id);
        setSpell(found);
      } catch (err) {
        console.error("Failed to fetch spells:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpells();
  }, [id, user]);

  const currentIndex = spells.findIndex((s) => s._id === id);
  const prevSpell = currentIndex > 0 ? spells[currentIndex - 1] : null;
  const nextSpell = currentIndex < spells.length - 1 ? spells[currentIndex + 1] : null;

  return (
    <PageWrapper loading={loading}>
      <div className="flex flex-col items-center mt-[200px]">
        {spell ? (
          <>
            {/* Spell detail card */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-300 p-6 rounded-lg shadow-md max-w-2xl w-full flex flex-col gap-6 items-start">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-900">
                {spell.name}
              </h2>
              <div className="space-y-2 text-gray-700 text-base">
                <p><strong>Type:</strong> {spell.type}</p>
                <p><strong>Effect:</strong> {spell.effect}</p>
                <p><strong>Incantation:</strong> <em>{spell.incantation}</em></p>
                <p><strong>Light:</strong> {spell.light || "—"}</p>
                <p><strong>Creator:</strong> {spell.creator || "Unknown"}</p>
                <p><strong>Description:</strong> {spell.description || "Unknown"}</p>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => navigate("/spells")}
                className="px-5 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                ← Back
              </button>

              <button
                onClick={() => prevSpell && navigate(`/spells/${prevSpell._id}`)}
                disabled={!prevSpell}
                className={`px-4 py-2 rounded min-w-[90px] ${
                  prevSpell
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                ← Prev
              </button>

              <button
                onClick={() => nextSpell && navigate(`/spells/${nextSpell._id}`)}
                disabled={!nextSpell}
                className={`px-4 py-2 rounded min-w-[90px] ${
                  nextSpell
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600 pt-24">Spell not found</p>
        )}
      </div>
    </PageWrapper>
  );
};

export default SpellsDetail;
