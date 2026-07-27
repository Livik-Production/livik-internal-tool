// components/EmployeeForm/sections/ReviewSection.jsx
import React from 'react';

export default function ReviewSection({ form, educations }) {
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-md">
        <h4 className="font-semibold">Basic Info</h4>
        <div className="text-sm text-gray-700">
          {form.firstName} {form.lastName}
        </div>
        <div className="text-xs text-gray-500">{form.email}</div>
      </div>

      <div className="p-4 border rounded-md">
        <h4 className="font-semibold">Address</h4>
        <div className="text-sm text-gray-700">
          Present: {form.presentAddress}
        </div>
        <div className="text-sm text-gray-700">
          Permanent: {form.permanentAddress}
        </div>
      </div>

      <div className="p-4 border rounded-md">
        <h4 className="font-semibold">Education</h4>
        <div className="space-y-2">
          {educations.map((e, i) => (
            <div key={i} className="text-sm text-gray-700">
              <strong>{e.qualification}</strong> — {e.institution} (
              {e.yearCompleted})
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border rounded-md">
        <h4 className="font-semibold">Employment & Bank</h4>
        <div className="text-sm text-gray-700">
          Designation: {form.designation}
        </div>
        <div className="text-sm text-gray-700">
          Department: {form.department}
        </div>
        <div className="text-sm text-gray-700">
          Work Mode: {form.workMode || '—'}
          {form.workMode === 'WFO' && form.wfoOffice ? ` (${form.wfoOffice})` : ''}
        </div>
        <div className="text-sm text-gray-700">
          Bank: {form.bankName} • {form.accountNumber}
        </div>
      </div>

      <div className="p-4 border rounded-md">
        <h4 className="font-semibold text-gray-700 mb-3">Bond & Documents</h4>
        <div className="space-y-2">
          <div className="flex">
            <span className="w-40 text-gray-600">Bond Duration:</span>
            <span>
              {form.bondDuration
                ? `${form.bondDuration} years`
                : 'Not specified'}
            </span>
          </div>
          <div className="flex">
            <span className="w-40 text-gray-600">Documents Collected:</span>
            <span>
              {form.documentsCollected && form.documentsCollected.length > 0
                ? `${form.documentsCollected.length} documents`
                : 'None'}
            </span>
          </div>
          {form.bondRemarks && (
            <div className="flex">
              <span className="w-40 text-gray-600">Remarks:</span>
              <span className="flex-1">{form.bondRemarks}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border rounded-md">
        <h4 className="font-semibold mb-3">Uploaded Documents</h4>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-wider">Photo</span>
            {form.photo ? (
              <img src={form.photo} alt="Photo" className="w-16 h-16 object-cover rounded-xl border border-blue-100 shadow-sm" />
            ) : (
              <div className="w-16 h-16 bg-gray-50 rounded-xl border flex items-center justify-center text-[10px] text-gray-400">N/A</div>
            )}
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-wider">Aadhaar</span>
            {form.aadhaarCard ? (
              form.aadhaarCard.toLowerCase().endsWith('.pdf') ? (
                <div className="w-16 h-16 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center text-[10px] text-blue-500 font-bold uppercase">PDF</div>
              ) : (
                <img src={form.aadhaarCard} alt="Aadhaar" className="w-16 h-16 object-cover rounded-xl border border-blue-100 shadow-sm" />
              )
            ) : (
              <div className="w-16 h-16 bg-gray-50 rounded-xl border flex items-center justify-center text-[10px] text-gray-400">N/A</div>
            )}
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-wider">PAN</span>
            {form.panCard ? (
              form.panCard.toLowerCase().endsWith('.pdf') ? (
                <div className="w-16 h-16 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-center text-[10px] text-purple-500 font-bold uppercase">PDF</div>
              ) : (
                <img src={form.panCard} alt="PAN" className="w-16 h-16 object-cover rounded-xl border border-purple-100 shadow-sm" />
              )
            ) : (
              <div className="w-16 h-16 bg-gray-50 rounded-xl border flex items-center justify-center text-[10px] text-gray-400">N/A</div>
            )}
          </div>
        </div>

        {form.proofs && form.proofs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
             <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Other Attachments</h5>
             <div className="grid grid-cols-2 gap-3">
                {form.proofs.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="p-1.5 bg-white rounded shadow-xs text-gray-500">
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                    <div className="min-w-0">
                       <div className="text-[10px] font-bold text-gray-700 truncate">{p.label}</div>
                       <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-500 hover:underline">View File</a>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
