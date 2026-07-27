// store/slices/approvalsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = [
  {
    id: 'A101',
    type: 'Leave Request',
    employee: 'Meera Singh',
    details: 'Casual leave — 2 days',
    status: 'Pending',
  },
];

const approvalsSlice = createSlice({
  name: 'approvals',
  initialState,
  reducers: {
    approve: (state, action) => {
      const i = state.findIndex((a) => a.id === action.payload);
      if (i >= 0) state[i].status = 'Approved';
    },
    reject: (state, action) => {
      const i = state.findIndex((a) => a.id === action.payload);
      if (i >= 0) state[i].status = 'Rejected';
    },
    addApproval: (state, action) => {
      state.unshift(action.payload);
    },
  },
});

export const { approve, reject, addApproval } = approvalsSlice.actions;
export default approvalsSlice.reducer;
