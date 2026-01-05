import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../src/utils/axiosInstance";

// Fetch all the users (admin only)
export const fetchUser = createAsyncThunk(
  "admin/fetchUser",
  async () => {
    const token = localStorage.getItem("userToken"); 
    if (!token) throw new Error("No user token found");

    const response = await axiosInstance.get("/api/admin/users");
    return response.data;
  }
);


// Add the create user action
export const addUser = createAsyncThunk(
    "admin/addUser", 
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post( 
                `/api/admin/users`, 
                userData,
            );
            return response.data;
        } catch (error) {
            console.log(error);
            return rejectWithValue(error.response.data);
        }
    }
);

// Update user info
export const updateUser = createAsyncThunk(
    "admin/updateUser", 
    async ({ id, name, email, role}) => {
        const response = await axiosInstance.put(
            `/api/admin/users/${id}`,
            { name, email, role },
        );
        return response.data;
    }
);

// Delete a  user
export const deleteUser = createAsyncThunk("admin/deleteUser", async (id) => {
    await axiosInstance.delete(`/api/admin/users/${id}`);
    return id;
    }
);

const adminSlice = createSlice({
    name: "admin",
    initialState: {
        users: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
        // Fetch users
        .addCase(fetchUser.pending, (state) => {
            state.loading = true;
        })
        .addCase(fetchUser.fulfilled, (state, action) => {
            state.loading = false;
            state.users = action.payload;
        })
        .addCase(fetchUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        // Update user
        .addCase(updateUser.fulfilled, (state, action) => {
            const updatedUser = action.payload;
            const userIndex = state.users.findIndex(
                (user) => user._id === updatedUser._id
            );
            if (userIndex !== -1) {
                state.users[userIndex] = updatedUser;
            }
        })
        // Delete user
        .addCase(deleteUser.fulfilled, (state, action) => {
            state.users = state.users.filter((user) => user._id !== action.payload);
        })
        // Add user
        .addCase(addUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(addUser.fulfilled, (state) => {
            state.loading = false;
        })
        .addCase(addUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload?.message || action.error.message;
        })
    },
});


export default adminSlice.reducer;
