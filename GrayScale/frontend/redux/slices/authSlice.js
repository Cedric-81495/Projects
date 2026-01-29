// frontend/redux/slice/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../src/utils/axiosInstance";

// Retrieve user info and token from localstorage if available
let userFromStorage = null;
try {
    const stored = localStorage.getItem("userInfo");
    if (stored) {
        userFromStorage = JSON.parse(stored);
    }
} catch (error) {
    console.warn("Invalid userInfo in localStorage, clearing it", error);
    localStorage.removeItem("userInfo");
}


// Check for an existing guest ID in the localstorage or generate new One
const initialGuestId =
    localStorage.getItem("guestId") || `guest_${new Date().getTime()}`;
localStorage.setItem("guestId", initialGuestId);

// Intial state
const initialState = {
    user: userFromStorage,
    guestId: initialGuestId,
    loading: false, 
    error: null,
};

// Async Thunk for User Login
export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async (userData, { rejectWithValue }) => {
        try { 
            const response = await axiosInstance.post(
                `/api/users/login`,
                userData
            );
    
            const userWithToken = {
            ...response.data.user,
            token: response.data.token,
            };
            localStorage.setItem("userInfo", JSON.stringify(userWithToken));
            localStorage.setItem("userToken", response.data.token); // important

            // Return user WITH token
            return userWithToken;
        } 
        catch(error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Async Thunk for Google Login
export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (credential, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/api/users/google", { credential });

      const userWithToken = {
        ...response.data.user,
        token: response.data.token,
      };

      // Save to localStorage
      localStorage.setItem("userInfo", JSON.stringify(userWithToken));
      localStorage.setItem("userToken", response.data.token);

      return userWithToken;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Google login failed" });
    }
  }
);


// Async Thunk for User Registration
export const registerUser = createAsyncThunk(
    "auth/registerUser",
    async (userData, { rejectWithValue }) => {
        try { 
            const response = await axiosInstance.post(
                `/api/users/register`,
                userData
            );
            const userWithToken = {
            ...response.data.user,
            token: response.data.token,
            };

            localStorage.setItem("userInfo", JSON.stringify(userWithToken));

// Return user WITH token
return userWithToken;


        } 
        catch(error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Async Thunk for User Logout
// Async Thunk for User Logout (no backend request)
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { fulfillWithValue }) => {
    // Simulate async so loading spinner can show
    await new Promise((resolve) => setTimeout(resolve, 300));
    return fulfillWithValue(true);
  }
);

// Slice 
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        generateNewGuestId: (state) => {
            state.guestId = `guest_${new Date().getTime()}`;
            localStorage.setItem("guestId", state.guestId);
        },

    },
    extraReducers: (builder) => {
        builder
            // GOOGLE LOGIN
            .addCase(loginWithGoogle.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginWithGoogle.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(loginWithGoogle.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Google login failed";
            })
            // LOGIN
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Login failed incorrect email or password";
            })
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            // REGISTER 
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                  state.error = action.payload?.message || "Register failed";
            })
            // LOGOUT 
            .addCase(logoutUser.pending, (state) => {
            state.loading = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
            state.loading = false;
            state.user = null;

            state.guestId = `guest_${new Date().getTime()}`;
            
            localStorage.removeItem("userInfo");
            localStorage.setItem("guestId", state.guestId);
            })
            .addCase(logoutUser.rejected, (state) => {
            state.loading = false;
            });
    },
});

export const { generateNewGuestId } = authSlice.actions;
export default authSlice.reducer;