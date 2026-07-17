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
      let jsonData = [];

      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) throw new Error('No data found in CSV file');

        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && line[i+1] === '"' && inQuotes) {
              current += '"';
              i++;
            } else if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current);
          return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.trim());

        jsonData = lines.slice(1).map(line => {
           const row = parseCSVLine(line);
           const obj = {};
           headers.forEach((header, index) => {
              obj[header] = row[index] !== undefined ? row[index].trim() : '';
           });
           return obj;
        });
      } else {
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

        jsonData = rows.slice(1).map((row) => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index + 1];
          });
          return obj;
        });
      }

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
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const d = String(date.getDate()).padStart(2, '0');
              parsedDate = `${y}-${m}-${d}`;
            }

            // Excel serial number
            else if (typeof date === 'number') {
              const excelEpoch = new Date(1899, 11, 30);
              const jsDate = new Date(excelEpoch.getTime() + date * 86400000);
              const y = jsDate.getFullYear();
              const m = String(jsDate.getMonth() + 1).padStart(2, '0');
              const d = String(jsDate.getDate()).padStart(2, '0');
              parsedDate = `${y}-${m}-${d}`;
            }

            // String date
            else if (typeof date === 'string') {
              const parts = date.split(/[-/]/).map(p => p.trim());
              
              if (parts.length === 3 && parts[0].length === 4) {
                 // Format: YYYY-MM-DD
                 parsedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              } else if (parts.length === 3 && parts[2].length === 4 && !isNaN(parts[1])) {
                 // Format: DD/MM/YYYY or MM/DD/YYYY
                 const y = parts[2];
                 let m = parts[1];
                 let d = parts[0];
                 
                 // If the middle part is > 12, it must be DD/MM/YYYY
                 // Wait, if middle is > 12, it's NOT a month. It means parts[0] is month and parts[1] is day (MM/DD/YYYY)
                 if (parseInt(m, 10) > 12) {
                    m = parts[0];
                    d = parts[1];
                 }
                 // Default to DD/MM/YYYY (matches our CSV export format)
                 parsedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
              } else {
                const testDate = new Date(date);
                if (!isNaN(testDate.getTime())) {
                   const ty = testDate.getFullYear();
                   const tm = String(testDate.getMonth() + 1).padStart(2, '0');
                   const td = String(testDate.getDate()).padStart(2, '0');
                   parsedDate = `${ty}-${tm}-${td}`;
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
          Upload an Excel or CSV file containing the holiday list. The file should
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
              {file ? file.name : 'Click to browse Excel or CSV file'}
            </p>

            <input
              type="file"
              id="holiday-file"
              accept=".xlsx,.xls,.csv"
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
              Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
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
