// store/slices/employeesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/employees');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch employees: ${res.status} ${text}`);
      }
      const data = await res.json();
      // `data` may be an array (if route returns array) or object with { items }
      const rawList = Array.isArray(data) ? data : (data.items ?? []);

      // Map server object to UI object shape expected by HRPage
      const mapped = rawList.map((emp) => {
        // prefer emp.empId (LK001) for id if present; otherwise use emp.id (uuid)
        const id = emp.empId ?? emp.id;
        const name =
          (emp.firstName ? emp.firstName : '') +
          (emp.lastName ? ` ${emp.lastName}` : '');
        return {
          id: id,
          name: name.trim() || emp.name || '',
          email: emp.email ?? emp.emailAddress ?? '',
          mobile: emp.phoneNumber ?? emp.phoneNumber ?? '',
          // UI used `role` earlier; DB uses `designation`
          designation: emp.designation ?? emp.designation ?? '',
          // We don't have status in DB; default to PENDING (you can change)
          status: emp.status ?? 'PENDING',

          // -- Map DB Bond fields to UI state --
          // Calculate duration if dates exist
          bondDuration: (() => {
            // Prefer stored bondDuration from DB
            if (emp.bondDuration) return String(emp.bondDuration);
            // Fallback: calculate from dates
            if (emp.bondEndDate && emp.bondStartDate) {
              const start = new Date(emp.bondStartDate);
              const end = new Date(emp.bondEndDate);
              const diffTime = Math.abs(end - start);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const years = diffDays / 365.25;
              return (Math.round(years * 2) / 2).toString();
            }
            return emp.isOnBond ? '0' : ''; // fallback
          })(),
          bondRemarks: emp.bondRemarks ?? '',

          // -- Map DB Document fields to UI Array --
          documentsCollected: [
            emp.docSSLCCollected ? 'sslc' : null,
            emp.docHSCCollected ? 'hsc' : null,
            emp.docDegreeCollected ? 'degree' : null,
          ].filter(Boolean),

          // keep original object available for deeper UI use if needed
          __raw: emp,
        };
      });

      return mapped;
    } catch (err) {
      return rejectWithValue(err.message ?? 'Failed to fetch employees');
    }
  }
);

const initialState = {
  items: [], // array of mapped employees
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    addEmployee: (state, action) => {
      // action.payload expected to be an employee object in UI shape
      state.items.unshift(action.payload);
    },
    deleteEmployee: (state, action) => {
      // action.payload is id
      state.items = state.items.filter((e) => e.id !== action.payload);
    },
    updateEmployee: (state, action) => {
      const i = state.items.findIndex((x) => x.id === action.payload.id);
      if (i >= 0) state.items[i] = action.payload;
    },
    setEmployees: (state, action) => {
      state.items = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });
  },
});

export const { addEmployee, deleteEmployee, updateEmployee, setEmployees } =
  employeesSlice.actions;

export const selectEmployeesItems = (state) => state.employees.items;
export const selectEmployeesStatus = (state) => state.employees.status;
export const selectEmployeesError = (state) => state.employees.error;

export default employeesSlice.reducer;
