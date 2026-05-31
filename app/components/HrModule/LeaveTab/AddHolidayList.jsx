'use client';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
// components/HrModule/LeaveTab/AddHolidayList.jsx

import { useState } from 'react';

import * as XLSX from 'xlsx';

const AddHolidayList = ({ onCancel }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Normalize keys
        const formattedData = jsonData
          .map((row) => {
            // Try to handle various column name possibilities
            const date = row['Date'] || row['date'] || row['Holiday Date'];
            const name =
              row['Holiday'] ||
              row['holiday'] ||
              row['Holiday Name'] ||
              row['name'];
            const type = row['Type'] || row['type'] || row['Holiday Type'];
            const desc = row['Description'] || row['description'] || '';

            // Robust date parsing
            let parsedDate = null;

            if (date) {
              // Check if it's an Excel serial number (number type)
              if (typeof date === 'number') {
                // Excel serial date to JS Date
                // Excel epoch is 1900-01-01, but has a bug treating 1900 as leap year
                const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
                const jsDate = new Date(excelEpoch.getTime() + date * 86400000);
                parsedDate = jsDate.toISOString().split('T')[0]; // YYYY-MM-DD
              }
              // Check if it's already a string date
              else if (typeof date === 'string') {
                // Try to parse various date formats
                const testDate = new Date(date);
                if (!isNaN(testDate.getTime())) {
                  parsedDate = testDate.toISOString().split('T')[0]; // YYYY-MM-DD
                } else {
                  // Try DD/MM/YYYY or MM/DD/YYYY format
                  const parts = date.split(/[-/]/);
                  if (parts.length === 3) {
                    // Assume YYYY-MM-DD or DD-MM-YYYY
                    if (parts[0].length === 4) {
                      parsedDate = date; // Already YYYY-MM-DD
                    } else {
                      // Try DD/MM/YYYY
                      const testDate2 = new Date(
                        `${parts[2]}-${parts[1]}-${parts[0]}`
                      );
                      if (!isNaN(testDate2.getTime())) {
                        parsedDate = testDate2.toISOString().split('T')[0];
                      }
                    }
                  }
                }
              }
            }

            return {
              holidayDate: parsedDate,
              holidayName: name,
              holidayType: type,
              description: desc,
            };
          })
          .filter((item) => item.holidayDate && item.holidayName);

        if (formattedData.length === 0) {
          throw new Error('No valid holiday data found in file');
        }

        // Send to API
        const res = await fetch('/api/hr/holidays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Upload failed');
        }

        alert(`Successfully uploaded ${formattedData.length} holidays!`);

        // Trigger refresh
        window.dispatchEvent(new Event('refreshHolidays'));

        onCancel();
      } catch (err) {
        console.error(err);
        alert('Error processing file: ' + err.message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Upload Holiday List
        </h3>
        <p className="text-sm text-gray-500">
          Upload a CSV or Excel file containing the holiday list. The file
          should include columns for date, holiday name, type, and description.
        </p>
      </div>

      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600 mb-2">
              {file
                ? file.name
                : 'Drag & drop your file here or click to browse'}
            </p>
            <input
              type="file"
              id="holiday-file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="holiday-file"
              className="px-4 py-2 bg-[#004475] text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
            >
              Browse Files
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: CSV, Excel (.xlsx, .xls)
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <PrimaryButton
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          disabled={uploading}
        >
          Cancel
        </PrimaryButton>
        <PrimaryButton
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !file || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {uploading ? 'Uploading...' : 'Upload Holiday List'}
        </PrimaryButton>
      </div>
    </div>
  );
};

export default AddHolidayList;
