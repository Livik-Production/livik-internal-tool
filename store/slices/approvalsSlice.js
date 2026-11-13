// store/slices/approvalsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [
    {
      id: 'A101',
      type: 'Leave Request',
      employee: 'Meera Singh',
      details: 'Casual leave — 2 days',
      status: 'Pending',
    },
  ],
  filter: {}, // Initial filter state
};

const approvalsSlice = createSlice({
  name: 'approvals',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    approve: (state, action) => {
      const i = state.items.findIndex((a) => a.id === action.payload);
      if (i >= 0) state.items[i].status = 'Approved';
    },
    reject: (state, action) => {
      const i = state.items.findIndex((a) => a.id === action.payload);
      if (i >= 0) state.items[i].status = 'Rejected';
    },
    addApproval: (state, action) => {
      state.items.unshift(action.payload);
    },
  },
});

export const { approve, reject, addApproval, setFilter } = approvalsSlice.actions;
export default approvalsSlice.reducer;
