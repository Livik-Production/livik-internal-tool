import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        throw new Error('Not authenticated');
      }

      return await res.json(); // user object
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null, // logged-in employee
    status: 'idle',
    error: null,
  },
  reducers: {
    logoutSuccess(state) {
      state.user = null;
      state.status = 'failed'; // Prevent AuthBootstrap from auto-fetching
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = 'failed';
        state.user = null;
        state.error = action.payload;
      });
  },
});

export const { logoutSuccess } = authSlice.actions;

export const selectAuthUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;

export default authSlice.reducer;
