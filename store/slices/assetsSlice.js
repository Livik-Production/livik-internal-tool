import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchAssets = createAsyncThunk(
  'assets/fetchAssets',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/assets');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch assets: ${res.status} ${text}`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.items ?? []);

      const mapped = list.map((asset) => {
        // Find the current assignment (where returnDate is null)
        const activeAssignment = asset.assignments?.find(
          (a) => a.returnDate === null
        );

        // Check for active repairs using relational data
        const repairs = asset.repairs || [];
        const hasActiveRepair = repairs.some(
          (r) => r.status && r.status !== 'Completed'
        );
        let assignedTo = null;
        if (activeAssignment) {
          if (activeAssignment.assignmentType === 'LOCATION') {
             assignedTo = {
               id: activeAssignment.locationId,
               empId: 'LOCATION',
               name: activeAssignment.locationName || `Location (ID: ${activeAssignment.locationId?.substring(0,6) || 'Unknown'})`,
             };
          } else if (activeAssignment.employee) {
             assignedTo = {
               id: activeAssignment.employee.id,
               empId: activeAssignment.employee.empId,
               name: `${activeAssignment.employee.firstName} ${activeAssignment.employee.lastName}`,
             };
          }
        }

        return {
          id: asset.id,
          tag: asset.assetTag ?? '',
          categoryId: asset.categoryId ?? '',
          category: asset.category?.name ?? '',
          deviceType: asset.deviceType ?? '',
          brand: asset.brand ?? '',
          model: asset.modelName ?? '',
          serial: asset.serialNumber ?? '',
          vendor: asset.vendor ?? '',
          purchaseDate: asset.purchaseDate ?? null,
          cost: asset.purchaseCost ?? 0,
          warrantyUntil: asset.warrantyUntil ?? null,
          invoiceFile: asset.invoiceFile ?? '',
          warrantyFile: asset.warrantyFile ?? '',
          notes: asset.notes ?? '',
          specs: asset.specs ?? {},
          repairs: asset.repairs || [],
          status: hasActiveRepair
            ? 'In Repair'
            : activeAssignment
              ? 'Assigned'
              : 'Unassigned',
          assignedTo: assignedTo,
          assignmentId: activeAssignment?.id ?? null,
          assignmentDate: activeAssignment?.assignedDate ?? null,
          assignmentNotes: activeAssignment?.notes ?? null,
          __raw: asset,
        };
      });

      return mapped;
    } catch (err) {
      return rejectWithValue(err.message ?? 'Failed to fetch assets');
    }
  }
);

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    addAsset: (state, action) => {
      state.items.unshift(action.payload);
    },
    deleteAsset: (state, action) => {
      state.items = state.items.filter((a) => a.id !== action.payload);
    },
    updateAsset: (state, action) => {
      const i = state.items.findIndex((x) => x.id === action.payload.id);
      if (i >= 0) state.items[i] = action.payload;
    },
    setAssets: (state, action) => {
      state.items = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchAssets.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });
  },
});

// ---------------- Exports -----------------

export const { addAsset, deleteAsset, updateAsset, setAssets } =
  assetsSlice.actions;

export const selectAssetsItems = (state) => state.assets.items;
export const selectAssetsStatus = (state) => state.assets.status;
export const selectAssetsError = (state) => state.assets.error;

export default assetsSlice.reducer;
