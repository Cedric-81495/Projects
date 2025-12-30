import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}`
const USER_TOKEN = `Bearer ${localStorage.getItem("userToken")}`

// Fetch admin products
export const fetchAdminProducts = createAsyncThunk(
    "adminProducts/fetchProducts",
        async () => {
        const response = await axios.get(`${API_URL}/api/admin/products`, {
           headers: {
            Authorization: USER_TOKEN,
           } 
        });
        return response.data;
    }
);

// Create a new product
export const createProduct = createAsyncThunk(
    "adminProducts/createProduct", 
    async (productData) => {
        const response = await axios.post(
            `${import.meta.env.API_URL}/api/admin/products`,
            productData,
            {
                headers: {
                    Authorization: USER_TOKEN,
                },
            }
        );
        return response.data;
    }
);

// Update an existing product
export const updateProduct = createAsyncThunk(
    "adminProducts/updateProduct", 
    async ({id, productData}) => {
        const response = await axios.put(
            `${API_URL}/admin/products/${id}`,
            productData,
            {
                headers: {
                    Authorization: USER_TOKEN,
                },
            }
        );
        return response.data;
    }
);

// Delete a product 
export const deleteProduct = createAsyncThunk("adminProducts/deleteProduct", async (id) => {
    await axios.delete(`${API_URL}/api/admin/products/${id}`, {
        headers: { Authorization: USER_TOKEN, }
    });
    return id;
    }
);

const adminProductSlice = createSlice({
    name: "adminProducts",
    initialState: {
        products: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraRecuders: (builder) => {
        builder
        // Fetch admin products
        .addCase(fetchAdminProducts.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchAdminProducts.fulfilled, (state, action) => {
            state.loading = false;
            state.products = action.payload;
        })
        .addCase(fetchAdminProducts.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        // Create product
        .addCase(createProduct.fulfilled, (state, action) => {
            state.products.push(action.payload);
        })
        // update product
        .addCase(updateProduct.fulfilled, (state, action) =>{
            const index = state.products.findIndex(
                (product) => product._id === action.payload._id
            );
            if (index !== -1) {
                state.products[index] = action.payload;
            }
        })
        // Delete product
        .addCaser(deleteProduct.fulfilled, (state, action) => {
            state.products = state.products.filter(
                (product) => product._id !== action.payload
            );
        })
    }, 
});

export default adminProductSlice.reducer;