import { useSearchParams } from "react-router-dom";

const FilterSideBar = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // helper functions
  const getArrayParam = (key) => {
    const val = searchParams.get(key);
    return val ? val.split(",") : [];
  };

  const getParam = (key) => searchParams.get(key) || "";

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (!value || (Array.isArray(value) && value.length === 0)) {
      params.delete(key);
    } else if (Array.isArray(value)) {
      params.set(key, value.join(","));
    } else {
      params.set(key, value);
    }
    setSearchParams(params);
  };

  const toggleArrayParam = (key, value) => {
    const current = getArrayParam(key);
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateParam(key, updated);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // derived filter state
  const filters = {
    category: getParam("category"),
    gender: getParam("gender"),
    color: getArrayParam("color"),
    size: getArrayParam("size"),
    material: getArrayParam("material"),
    brand: getArrayParam("brand"),
    minPrice: Number(getParam("minPrice")) || 0,
    maxPrice: Number(getParam("maxPrice")) || 15000,
  };

  // filter options
  const categories = ["Top Wear", "Bottom Wear"];
  const genders = ["Men", "Women"];
  const colors = ["Red","Blue","Black","Green","Yellow","Gray","White","Pink","Beige","Navy"];
  const sizes = ["XS","S","M","L","XL","XXL"];
  const materials = ["Cotton","Wool","Denim","Polyester","Silk","Linen","Viscose","Fleece"];
  const brands = ["Urban Threads","Modern Fit","Street Style","Beach Breeze","Fasionista","ChicStyle"];

  const handlePriceChange = (e) => {
    updateParam("minPrice", 0);
    updateParam("maxPrice", Number(e.target.value));
  };

  return (
    <div className="p-4">

      {/* Clear All Filters Button */}
      <button
        onClick={clearFilters}
        className="mb-4 px-3 py-1 bg-gray-100 rounded-md text-red-600 text-sm font-semibold hover:bg-gray-200"
      >
        Clear All Filters
      </button>

      {/* CATEGORY */}
      <div className="mb-4">
        <p className="font-semibold text-gray-700">Category</p>
        {categories.map((c) => (
          <label key={c} className="flex gap-2 items-center mb-1">
            <input
              type="radio"
              checked={filters.category === c}
              onChange={() => updateParam("category", c)}
            />
            {c}
          </label>
        ))}
      </div>

      {/* GENDER */}
      <div className="mb-4">
        <p className="font-semibold text-gray-700">Gender</p>
        {genders.map((g) => (
          <label key={g} className="flex gap-2 items-center mb-1">
            <input
              type="radio"
              checked={filters.gender === g}
              onChange={() => updateParam("gender", g)}
            />
            {g}
          </label>
        ))}
      </div>

      {/* COLORS */}
      <div className="mb-4">
        <p className="font-semibold text-gray-700">Colors</p>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => toggleArrayParam("color", c)}
              className={`w-8 h-8 rounded-full border transition hover:scale-105
                ${filters.color.includes(c) ? "ring-2 ring-blue-500" : ""}`}
              style={{ backgroundColor: c.toLowerCase() }}
            />
          ))}
        </div>
      </div>

      {/* SIZES */}
      <div className="mb-4">
        <p className="font-semibold text-gray-700">Sizes</p>
        {sizes.map((s) => (
          <label key={s} className="flex gap-2 items-center mb-1">
            <input
              type="checkbox"
              checked={filters.size.includes(s)}
              onChange={() => toggleArrayParam("size", s)}
            />
            {s}
          </label>
        ))}
      </div>

      {/* MATERIALS */}
      <div className="mb-4">
        <p className="font-semibold text-gray-700">Materials</p>
        {materials.map((m) => (
          <label key={m} className="flex gap-2 items-center mb-1">
            <input
              type="checkbox"
              checked={filters.material.includes(m)}
              onChange={() => toggleArrayParam("material", m)}
            />
            {m}
          </label>
        ))}
      </div>

      {/* BRANDS */}
      <div className="mb-4">
        <p className="font-semibold text-gray-700">Brands</p>
        {brands.map((b) => (
          <label key={b} className="flex gap-2 items-center mb-1">
            <input
              type="checkbox"
              checked={filters.brand.includes(b)}
              onChange={() => toggleArrayParam("brand", b)}
            />
            {b}
          </label>
        ))}
      </div>

      {/* PRICE RANGE */}
      <div className="mb-6">
        <p className="font-semibold text-gray-700">Price Range</p>
        <input
          type="range"
          min={0}
          max={15000}
          value={filters.maxPrice}
          onChange={handlePriceChange}
          className="w-full"
        />
        <div className="flex justify-between text-gray-600 text-sm">
          <span>₱0</span>
          <span>₱{filters.maxPrice}</span>
        </div>
      </div>

    </div>
  );
};

export default FilterSideBar;
