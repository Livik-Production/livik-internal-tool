import React from 'react';
import { Loader2 } from 'lucide-react';
import CustomModalForm from '../CustomModalForm';

export default function CRMMoveCustomerModal({
  showMoveCustomerModal,
  setShowMoveCustomerModal,
  formMoveStatus,
  setFormMoveStatus,
  handleSaveMoveCustomer,
  isSubmitting,
}) {
  return (
    <CustomModalForm
      open={showMoveCustomerModal}
      onClose={() => setShowMoveCustomerModal(false)}
      title="Move Customer Status"
      widthClass="max-w-sm"
    >
      <form onSubmit={handleSaveMoveCustomer} className="space-y-4 p-6">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
            Target Status / Stage
          </label>
          <select
            value={formMoveStatus}
            onChange={(e) => setFormMoveStatus(e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-805 px-3 py-2 rounded-lg transition-colors cursor-pointer font-semibold"
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowMoveCustomerModal(false)}
            className="px-5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-705 font-bold text-sm rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-[#004475] hover:bg-[#33a8d9] text-white font-bold text-sm rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="animate-spin" size={16} />}
            <span>{isSubmitting ? 'Saving...' : 'Save Status'}</span>
          </button>
        </div>
      </form>
    </CustomModalForm>
  );
}
