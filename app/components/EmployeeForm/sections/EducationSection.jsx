// components/EmployeeForm/sections/EducationSection.jsx
import React from 'react';
import { Trash2 } from 'lucide-react';

export default function EducationSection({
  educations,
  addEducation,
  updateEducation,
  removeEducation,
  errors,
  isView,
}) {
  return (
    <div className="space-y-2.5">
      <div className="font-bold text-xl text-gray-800 mb-2 border-b pb-1">
        Education
      </div>
      <div className="flex items-center justify-end">
        {!isView && (
          <button
            type="button"
            onClick={addEducation}
            className="text-sm px-3 py-1 rounded-md border border-gray-400 hover:bg-gray-100"
          >
            + Add
          </button>
        )}
      </div>

      {errors.educations && (
        <div className="text-xs text-red-600">{errors.educations}</div>
      )}

      {isView ? (
        <div className="space-y-6 mt-4">
          {educations.map((edu, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-4 items-start">
              {/* Left Column (Year) */}
              <div className="md:w-[60px] shrink-0 flex flex-col text-md">
                <span className="font-semibold text-gray-900">{edu.yearCompleted || '-'}</span>
              </div>

              {/* Center Column (Degree) */}
              <div className="md:w-[120px] shrink-0 flex flex-col text-md">
                <span className="text-gray-600 font-medium">{edu.qualification || '-'}</span>
              </div>

              {/* Right Column (Institution) */}
              <div className="flex-1 flex flex-col">
                <span className="font-bold text-gray-900 text-[15px]">{edu.institution || '-'}</span>
                <span className="text-gray-700 text-sm font-medium">{edu.university || '-'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        educations.map((edu, idx) => (
          <div
            key={idx}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-1.5 pb-2 border border-gray-300 rounded-md"
          >
            <div className="md:col-span-4">
              <label className="text-xs text-gray-600">University / Board</label>
              <input
                value={edu.university}
                onChange={(e) =>
                  updateEducation(idx, 'university', e.target.value)
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="md:col-span-4">
              <label className="text-xs text-gray-600">
                Institution / School / College
              </label>
              <input
                value={edu.institution}
                onChange={(e) =>
                  updateEducation(idx, 'institution', e.target.value)
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">
                Qualification / Degree
              </label>
              <input
                value={edu.qualification}
                onChange={(e) =>
                  updateEducation(idx, 'qualification', e.target.value)
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="md:col-span-1">
              <label className="text-xs text-gray-600">Year</label>
              <input
                value={edu.yearCompleted}
                onChange={(e) =>
                  updateEducation(idx, 'yearCompleted', e.target.value)
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                style={{ width: '80px' }}
                maxLength={4}
                placeholder="2023"
              />
              {errors.education_years && errors.education_years[idx] && (
                <div className="text-xs text-red-600 mt-1">
                  {errors.education_years[idx]}
                </div>
              )}
            </div>

            <div className="md:col-span-1 flex items-center justify-end h-full">
              <button
                type="button"
                onClick={() => removeEducation(idx)}
                className="border border-gray-300 bg-white text-red-600 hover:text-red-700 w-10 h-10 rounded-md flex items-center justify-center mt-7 cursor-pointer"
                aria-label="Delete education row"
              >
                <Trash2 size={20} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
