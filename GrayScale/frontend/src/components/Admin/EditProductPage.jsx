import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProductDetails } from "../../../redux/slices/productsSlice";
import { updateProduct } from "../../../redux/slices/adminProductSlice";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "sonner";

const EditProductPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    const { selectedProduct, loading, error } = useSelector((state) => state.products);

    // Initialize form state
    const [productData, setProductData] = useState({
        name: "",
        description: "",
        price: "",
        countInStock: "",
        discountPrice: "",
        isPublished: false,
        isFeatured: false,
        sku: "",
        category: "",
        brand: "",
        sizes: [],
        colors: [],
        collections: "",
        material: "",
        gender: "",
        images: [],
    });

    const [uploading, setUploading] = useState(false);

    // Fetch product details when page loads
    useEffect(() => {
        if (id) {
            dispatch(fetchProductDetails(id));
        }
    }, [dispatch, id]);

    // Populate form only when selectedProduct changes
    useEffect(() => {
        if (selectedProduct) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setProductData((prevData) => {
                const isDifferent = Object.keys(selectedProduct).some(
                    (key) => JSON.stringify(prevData[key]) !== JSON.stringify(selectedProduct[key])
                );
                return isDifferent ? selectedProduct : prevData;
            });
        }
    }, [selectedProduct]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProductData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be 5 MB or smaller");
            e.target.value = "";
            return;
        }
        const formData = new FormData();
        formData.append("image", file);

        try {
            setUploading(true);
            // axiosInstance attaches the admin's Bearer token (upload is admin-only now)
            const { data } = await axiosInstance.post("/api/upload", formData);

            setProductData((prevData) => ({
                ...prevData,
                images: [...prevData.images, { url: data.imageUrl, altText: file.name }],
            }));
            setUploading(false);
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Image upload failed");
            setUploading(false);
        }
    };

    const handleCheckbox = (e) => {
        const { name, checked } = e.target;
        setProductData((prev) => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const price = Number(productData.price);
        const sale = productData.discountPrice === "" || productData.discountPrice == null
            ? null
            : Number(productData.discountPrice);
        if (sale !== null && (!Number.isFinite(sale) || sale <= 0 || sale >= price)) {
            toast.error("Sale price must be greater than 0 and lower than the regular price");
            return;
        }

        try {
            // Wait for the server before leaving, so errors are actually shown
            await dispatch(
                updateProduct({ id, productData: { ...productData, discountPrice: sale ?? "" } })
            ).unwrap();
            toast.success("Product updated");
            navigate("/admin/products");
        } catch (message) {
            toast.error(typeof message === "string" ? message : "Failed to update product");
        }
    };

    if (loading) return <p>Loading edit page...</p>;
    if (error) return <p>Error loading product: {error}</p>;

    return (
    <div className="max-w-7xl mx-auto p-6 shadow-md rounded-md bg-gray-300">
        <h2 className="text-3xl font-bold mb-6">Edit Product</h2>
        <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="mb-6">
                <label className="block font-semibold mb-2">Product Name</label>
                 <input
                    type="text"
                    name="name"
                    value={productData.name}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md p-2"
                    required
                />
            </div>
             {/* Description */}
            <div className="mb-6">
                <label className="block font-semibold mb-2">Product Description</label>
                <textarea
                    type="text"
                    name="description"
                    value={productData.description}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md p-2"
                    rows={4}
                    required
                />
            </div>
            {/* Price */}
            <div className="mb-6">
                <label className="block font-semibold mb-2">Price</label>
                <input 
                    type="input"
                    name="price"
                    value={productData.price}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2"
                />
            </div>

            {/* Count In Stock */}
            <div className="mb-6">
                <label className="block font-semibold mb-2">Count in Stock</label>
                <input
                    type="number"
                    name="countInStock"
                    value={productData.countInStock}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2"
                />
            </div>
            {/* Sale Price */}
            <div className="mb-6">
                <label className="block font-semibold mb-2">Sale Price (optional)</label>
                <input
                    type="number"
                    name="discountPrice"
                    min="0"
                    step="0.01"
                    value={productData.discountPrice ?? ""}
                    onChange={handleChange}
                    placeholder="Leave empty for no sale"
                    className="w-full border border-gray-300 rounded-md p-2"
                />
                <p className="text-xs text-gray-600 mt-1">
                    Customers are charged this price when it's lower than the regular price.
                </p>
            </div>

            {/* Visibility */}
            <div className="mb-6 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                        type="checkbox"
                        name="isPublished"
                        checked={Boolean(productData.isPublished)}
                        onChange={handleCheckbox}
                    />
                    Published (visible in store)
                </label>
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                        type="checkbox"
                        name="isFeatured"
                        checked={Boolean(productData.isFeatured)}
                        onChange={handleCheckbox}
                    />
                    Featured
                </label>
            </div>

            {/* Sku */}
            <div className="mb-6">
                <label className="block font-semibold mb-2">SKU</label>
                <input 
                    type="input"
                    name="sku"
                    value={productData.sku}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md p-2"
                />
            </div>
             {/* Sizes */}
            <div className="mb-6">
                <label className="block font-semibold mb-2">Sizes (comma-separated)</label>
                <input 
                    type="text"
                    name="size"
                    value={productData.sizes.join(",")}
                    onChange={(e) => 
                        setProductData({ 
                            ...productData, 
                            sizes: e.target.value.split(",").map((size) => size.trim()),
                        })
                    }
                    className="w-full border border-gray-300 rounded-md p-2"
                />
            </div>
            {/* Colors */}
            <div className="mb-6">
                <label className="block font-semibold mb-2">Colors</label>
                <input 
                    type="text"
                    name="colors"
                    value={productData.colors.join(",")}
                    onChange={(e) => 
                        setProductData({ 
                            ...productData, 
                            colors: e.target.value.split(",").map((color) => color.trim()),
                        })
                    }
                    className="w-full border border-gray-300 rounded-md p-2"
                />
            </div>
            {/* Image Upload */}
            <div className="mb-6">
                <label className="block font-semibold mb-2">Upload Image</label>
                <input type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} />
                 {uploading && <p>Uploading image...</p>}
                <div className="flex gap-4 mt-4">
                        {productData.images.map((image, index) => (
                            <div key={index}>
                                <img
                                    src={image.url}
                                    alt={image.altText || "Product Image"}
                                    className="w-20 h-20 object-cover rounded-md shadow-md"
                                />
                            </div>
                        ))}
                </div>
            </div>
            <button 
                type="submit" 
                className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors"
                disabled={!productData.name}
            >
            Update Product
            </button>
        </form>
    </div>
  );
};

export default EditProductPage;