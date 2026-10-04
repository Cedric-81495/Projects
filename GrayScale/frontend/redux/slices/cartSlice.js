import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../src/utils/axiosInstance";
import { logoutUser } from "./authSlice";

// Helper function to load cart from localStorage
const loadCartFromStorage = () => {
    try {
        const storedCart = localStorage.getItem("cart");
        return storedCart ? JSON.parse(storedCart) : { products: [] };
    } catch {
        localStorage.removeItem("cart");
        return { products: [] };
    }
};

// Helper function to save the cart
const saveCartToStorage = (cart) => {
    localStorage.setItem("cart", JSON.stringify(cart));
};

// Fetch cart for a user or guest
export const fetchCart = createAsyncThunk(
    "cart/fetchCart",
    async ({ userId, guestId }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(
                `/api/cart`,
                {
                    params: { userId, guestId },
                }
            );
            return response.data;
        } catch(error) {
            return rejectWithValue({
                status: error.response?.status,
                message: error.response?.data?.message || "Failed to fetch cart",
            });
        }
    }
);

// Add an item to the cart for a user or guest
export const addToCart = createAsyncThunk(
    "cart/addToCart", 
    async ({ 
        productId, 
        quantity, 
        size, 
        color, 
        guestId, 
        userId
    }, {rejectWithValue}) => {
        try {
            const response = await axiosInstance.post(
                `/api/cart`,
                {
                    productId, 
                    quantity, 
                    size, 
                    color, 
                    guestId, 
                    userId,       
                }
            );
            return response.data;
        } catch(error) {
            console.log(error);
            return rejectWithValue(error.response?.data || { message: "Network error" });
        }
})

// Update the quantity of an item in the cart
export const updateCartItemQuantity = createAsyncThunk(
    "cart/updateCartItemQuantity", async ({ productId, quantity, guestId, userId, size, color },
        {rejectWithValue}) => {
        try {
            const response = await axiosInstance.put(`/api/cart`,
                {
                    productId, 
                    quantity, 
                    guestId, 
                    userId, 
                    size, 
                    color,
                }
            );
            return response.data;
        } catch (error) {   
            console.log(error);
            return rejectWithValue(error.response?.data || { message: "Network error" });
        }
    }
);

// Remove an item from the cart
// Remove an item from the cart
export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (
    { productId, quantity, guestId, userId, size, color },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.delete("/api/cart", {
        data: { productId, quantity, guestId, userId, size, color },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove item from cart"
      );
    }}
);

// Merge guest cart into user cart
export const mergeCart = createAsyncThunk(
    "cart/mergeCart",
    async ({ guestId, user}, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(
                `/api/cart/merge`,
                { guestId, user},
            );
            return response.data;
        } catch (error) {
            console.log(error);
            return rejectWithValue(error.response?.data || { message: "Network error" });
        }
    }
);

const cartSlice = createSlice({
    name: "cart",
    initialState: {
        cart: loadCartFromStorage(),
        loading: false,
        error: null,
    },
    reducers: {
        clearCart: (state) => {
            state.cart = {  products: []};
            localStorage.removeItem("cart");
        },
    },
    extraReducers: (builder) => {
    builder
        // Fetch Cart
        .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
        })
        .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
        saveCartToStorage(action.payload);
        })
        .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        // 404 = no cart on the server yet -> show an empty cart instead of stale local data
        if (action.payload?.status === 404) {
            state.cart = { products: [] };
            state.error = null;
            localStorage.removeItem("cart");
        } else {
            state.error = action.payload?.message || "Failed to fetch cart";
        }
        })

        // Logout -> wipe the previous user's cart from memory (authSlice clears storage)
        .addCase(logoutUser.fulfilled, (state) => {
        state.cart = { products: [] };
        state.loading = false;
        state.error = null;
        })

        // Add to Cart
        .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
        })
        .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
        saveCartToStorage(action.payload);
        })
        .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to add to cart";
        })

        // Update Cart Item Quantity
        .addCase(updateCartItemQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
        })
        .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
        saveCartToStorage(action.payload);
        })
        .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error =
            action.payload?.message || "Failed to update item quantity";
        })

        // Remove From Cart
        .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
        })
        .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
        saveCartToStorage(action.payload);
        })
        .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error =
            action.payload?.message || "Failed to remove item";
        })

        // Merge Cart
        .addCase(mergeCart.pending, (state) => {
        state.loading = true;
        state.error = null;
        })
        .addCase(mergeCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
        saveCartToStorage(action.payload);
        })
        .addCase(mergeCart.rejected, (state, action) => {
        state.loading = false;
        state.error =
            action.payload?.message || "Failed to merge cart";
        });
    },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;