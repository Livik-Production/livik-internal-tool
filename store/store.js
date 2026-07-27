// store/store.js
import { configureStore } from '@reduxjs/toolkit';
// import your slices here (example names)
import employeesReducer from './slices/employeesSlice';
import approvalsReducer from './slices/approvalsSlice';
import assetsReducer from './slices/assetsSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    employees: employeesReducer,
    approvals: approvalsReducer,
    assets: assetsReducer,
  },
  // devTools enabled by default in development
});
