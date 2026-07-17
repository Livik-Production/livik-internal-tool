'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Loader from '../../Loader';
import { X } from 'lucide-react';
import Button from '../../Buttons/Button';
import CloseButton from '../../Buttons/CloseButton';
import CustomModalForm from '../../CustomModalForm';
import PrimaryButton from '../../Buttons/PrimaryButton';

const CashFlowModal = ({ isOpen, onClose, inflowId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && inflowId) {
      const fetchDetail = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/expense/petty-cash?id=${inflowId}`);
          if (!res.ok) throw new Error('Failed to load breakdown');
          const result = await res.json();
          setData(result);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [isOpen, inflowId]);

  if (!isOpen || !mounted) return null;

  const footer = (
    <PrimaryButton
      onClick={onClose}
      className="px-6 py-2 border border-gray-300"
    >
      Close Breakdown
    </PrimaryButton>
  );

  return (
    <CustomModalForm
      open={isOpen}
      onCancel={onClose}
      title="Daily Petty Cash Breakdown"
      widthClass="max-w-4xl"
      footer={footer}
    >
      <div className="p-3">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader label="Calculating balance..." />
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-600 bg-red-50 rounded-xl">
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                  Opening Balance
                </p>
                <p className="text-lg font-bold text-gray-700">
                  ₹{data.openingBalance?.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">
                   Top-ups
                </p>
                <p className="text-lg font-bold text-blue-900">
                  ₹{Number(data.totalInflowToday || 0).toLocaleString()}
                </p>
                <p className="text-[9px] text-blue-500 mt-1">
                  This record: ₹
                  {parseFloat(data.receivedAmount).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-1">
                  Total Amount
                </p>
                <p className="text-lg font-bold text-purple-900">
                  ₹{((data.openingBalance || 0) + Number(data.totalInflowToday || 0)).toLocaleString()}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm md:col-span-1 col-span-2">
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1">
                  Balance in Hand
                </p>
                <p className="text-xl font-bold text-indigo-900">
                  ₹{(((data.openingBalance || 0) + Number(data.totalInflowToday || 0)) - (data.closingBalance || 0)).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">Transaction ID:</span>
                  <span className="text-sm font-mono font-bold text-gray-900 ml-2">
                    {data.id}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">Received On:</span>
                  <span className="text-sm font-medium text-gray-900 ml-2">
                    {new Date(data.receiveDate).toLocaleDateString(undefined, {
                      dateStyle: 'long',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Activity Breakdown
              </h3>
              <div className="overflow-y-auto max-h-[320px] border border-gray-100 rounded-xl shadow-sm custom-scrollbar">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-center">Top-ups</th>
                      <th className="px-4 py-3 text-center">Expenses</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {data.dailyBreakdown
                      .filter(
                        (day) => day.totalInflow > 0 || day.totalOutflow > 0
                      )
                      .map((day, idx) => (
                        <React.Fragment key={day.date}>
                          <tr
                            className={`group transition-colors ${day.date === data.receiveDate.split('T')[0] ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                          >
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-900">
                                {new Date(day.date).toLocaleDateString(
                                  undefined,
                                  { day: '2-digit', month: 'short' }
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {new Date(day.date).toLocaleDateString(
                                  undefined,
                                  { weekday: 'short' }
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {day.totalInflow > 0 ? (
                                <span className="text-green-600 font-bold">
                                  ₹{day.totalInflow.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {day.totalOutflow > 0 ? (
                                <span className="text-orange-600 font-bold">
                                  ₹{day.totalOutflow.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`font-mono font-bold italic ${day.closingBalance < 0 ? 'text-red-600' : 'text-gray-700'}`}
                              >
                                {day.closingBalance < 0 ? '-' : ''}₹
                                {Math.abs(day.closingBalance).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          {/* Multiple top-up sub-rows for days with more than one inflow */}
                          {day.inflows.length > 1 && (
                            <tr>
                              <td
                                colSpan="4"
                                className="px-4 py-2 bg-blue-50/20"
                              >
                                <div className="pl-4 border-l-2 border-blue-200 space-y-1.5">
                                  {day.inflows.map((inf) => (
                                    <div
                                      key={inf.id}
                                      className="flex justify-between items-center text-[11px]"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-600 font-medium">
                                          {inf.receiveFrom}
                                        </span>
                                        <span className="text-[9px] bg-blue-100 px-1.5 py-0.5 rounded text-blue-500">
                                          {inf.paymentMethod}
                                        </span>
                                      </div>
                                      <span className="text-green-600 font-semibold">
                                        +₹
                                        {Number(
                                          inf.receivedAmount
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                          {/* Expense sub-rows listed under each day */}
                          {day.expenses.length > 0 && (
                            <tr>
                              <td
                                colSpan="4"
                                className="px-4 py-2 bg-orange-50/20"
                              >
                                <div className="pl-4 border-l-2 border-orange-300 space-y-1.5">
                                  {day.expenses.map((exp) => (
                                    <div
                                      key={exp.id}
                                      className="flex justify-between items-center text-[11px]"
                                    >
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-gray-700 font-medium">
                                          {exp.itemName}
                                        </span>
                                        <span className="text-[9px] bg-orange-100 px-1.5 py-0.5 rounded text-orange-500 font-medium">
                                          {exp.category}
                                        </span>
                                        {exp.remarks && (
                                          <span className="text-[9px] text-gray-400 italic truncate max-w-[120px]">
                                            {exp.remarks}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-red-500 font-semibold shrink-0">
                                        -₹
                                        {Number(exp.amount).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Record Info */}
            {(data.createdAt || data.updatedAt) && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Record Info
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {data.createdAt && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                        Created At
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {new Date(data.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(data.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    </div>
                  )}
                  {data.updatedAt && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                        Last Updated
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {new Date(data.updatedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(data.updatedAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CustomModalForm>
  );
};

export default CashFlowModal;
