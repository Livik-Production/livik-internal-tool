'use client';

import { useState } from 'react';
import ExcelJS from 'exceljs';

import PrimaryButton from '../../Buttons/PrimaryButton';

const AddHolidayList = ({ onCancel }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

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

    try {
      const workbook = new ExcelJS.Workbook();

      const buffer = await file.arrayBuffer();

      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new Error('No worksheet found in file');
      }

      const rows = [];

      worksheet.eachRow((row) => {
        rows.push(row.values);
      });

      if (rows.length < 2) {
        throw new Error('No data found in file');
      }

      const headers = rows[0].slice(1).map((header) => String(header).trim());

      const jsonData = rows.slice(1).map((row) => {
        const obj = {};

        headers.forEach((header, index) => {
          obj[header] = row[index + 1];
        });

        return obj;
      });

      const formattedData = jsonData
        .map((row) => {
          const date = row['Date'] || row['date'] || row['Holiday Date'];

          const name =
            row['Holiday'] ||
            row['holiday'] ||
            row['Holiday Name'] ||
            row['name'];

          const type = row['Type'] || row['type'] || row['Holiday Type'];

          const desc = row['Description'] || row['description'] || '';

          let parsedDate = null;

          if (date) {
            // ExcelJS date cell
            if (date instanceof Date) {
              parsedDate = date.toISOString().split('T')[0];
            }

            // Excel serial number
            else if (typeof date === 'number') {
              const excelEpoch = new Date(1899, 11, 30);

              const jsDate = new Date(excelEpoch.getTime() + date * 86400000);

              parsedDate = jsDate.toISOString().split('T')[0];
            }

            // String date
            else if (typeof date === 'string') {
              const testDate = new Date(date);

              if (!isNaN(testDate.getTime())) {
                parsedDate = testDate.toISOString().split('T')[0];
              } else {
                const parts = date.split(/[-/]/);

                if (parts.length === 3) {
                  if (parts[0].length === 4) {
                    parsedDate = date;
                  } else {
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

      const res = await fetch('/api/hr/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!res.ok) {
        const errData = await res.json();

        throw new Error(errData.error || 'Upload failed');
      }

      alert(`Successfully uploaded ${formattedData.length} holidays!`);

      window.dispatchEvent(new Event('refreshHolidays'));

      onCancel();
    } catch (err) {
      console.error(err);

      alert('Error processing file: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Upload Holiday List
        </h3>

        <p className="text-sm text-gray-500">
          Upload an Excel file containing the holiday list. The file should
          include columns for date, holiday name, type, and description.
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
              {file ? file.name : 'Click to browse Excel file'}
            </p>

            <input
              type="file"
              id="holiday-file"
              accept=".xlsx,.xls"
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
              Supported formats: Excel (.xlsx, .xls)
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <PrimaryButton onClick={onCancel} disabled={uploading}>
          Cancel
        </PrimaryButton>

        <PrimaryButton
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`${
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
