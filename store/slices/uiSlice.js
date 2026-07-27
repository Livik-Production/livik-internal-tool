import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  fontSize: 14, // Default font size in pixels
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setFontSize: (state, action) => {
      state.fontSize = action.payload;
    },
  },
});

export const { setFontSize } = uiSlice.actions;
export default uiSlice.reducer;
