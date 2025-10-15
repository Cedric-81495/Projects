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

        const found = res.data.find((spell) => spell._id === id);
        setSpell(found);
        window.scrollTo({ top: 0, behavior: "smooth" }); // 👈 scroll to top on load
        setError(false);
      } catch (err) {
        console.error("Failed to fetch student or list:", err);
        setError(true); // ✅ handle API failure
      } finally {
        setLoading(false);
      }
    };
    fetchSpells();
  }, [id, user]);

  const currentIndex = spells.findIndex((s) => s._id === id);
  const prevSpell = currentIndex > 0 ? spells[currentIndex - 1] : null;
  const nextSpell = currentIndex < spells.length - 1 ? spells[currentIndex + 1] : null;

    if (loading) {
      return <PageWrapper loading={true} />;
    }

    if (error || !spell) {
      return (
        <PageWrapper loading={false}>
          <NotFound message="Spell not found" />
        </PageWrapper>
      );
    }
  return (
    <PageWrapper loading={false}>
      <div className="flex flex-col items-center px-4 py-10 sm:py-16">
            {/* Spell detail card */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-300 p-6 sm:p-8 rounded-lg shadow-md max-w-2xl w-full flex flex-col gap-6 items-start">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-900 break-words">
                {spell.name}
              </h2>
              <div className="space-y-2 text-gray-700 text-base sm:text-lg">
                <p><strong>Type:</strong> {spell.type}</p>
                <p><strong>Effect:</strong> {spell.effect}</p>
                <p><strong>Incantation:</strong> <em>{spell.incantation}</em></p>
                <p><strong>Light:</strong> {spell.light || "—"}</p>
                <p><strong>Creator:</strong> {spell.creator || "Unknown"}</p>
                <p><strong>Description:</strong> {spell.description || "Unknown"}</p>
              </div>
            </div>

            {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <button
              onClick={() => navigate("/spells")}
              className="w-[96px] px-2 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700"
            >
              ← Back
            </button>

            <button
              onClick={() => prevSpell && navigate(`/spells/${prevSpell._id}`)}
              disabled={!prevSpell}
              className="w-[96px] px-2 py-2 text-sm rounded disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-500"
            >
              ← Prev
            </button>

            <button
              onClick={() => nextSpell && navigate(`/spells/${nextSpell._id}`)}
              disabled={!nextSpell}
              className="w-[96px] px-2 py-2 text-sm rounded disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-500"
            >
              Next →
            </button>
          </div>
      </div>
    </PageWrapper>
  );
};

export default SpellsDetail;