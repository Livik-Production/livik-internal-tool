'use client';

import React from 'react';
import {
  Laptop,
  CheckCircle,
  Wrench,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import Loader from '../Loader';

export default function Overview({ assets = [], isViewOnly = false, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <Loader label="Loading dashboard..." size="md" fullScreen={false} />
      </div>
    );
  }
  // Helper to safely get properties
  const getAssetProperty = (asset, property) => {
    if (property === 'type' && asset.deviceType) return asset.deviceType;
    if (property === 'type' && asset.type) return asset.type;
    if (property === 'status' && asset.__raw?.status) return asset.__raw.status;
    if (property === 'status' && asset.status) return asset.status;
    if (property === 'cost' && asset.purchaseCost !== undefined)
      return asset.purchaseCost;
    if (property === 'cost' && asset.cost !== undefined) return asset.cost;
    if (property === 'warranty' && asset.warrantyUntil)
      return asset.warrantyUntil;
    return null;
  };

  const totalAssets = assets.length;

  const activeAssets = assets.filter((a) => {
    const status = getAssetProperty(a, 'status');
    return status === 'Assigned' || status === 'Unassigned';
  }).length;

  const inMaintenance = assets.filter((a) => {
    const status = getAssetProperty(a, 'status');
    return status === 'In Repair';
  }).length;

  const warrantyExpiringCount = assets.filter((a) => {
    const warrantyDateStr = getAssetProperty(a, 'warranty');
    if (!warrantyDateStr) return false;
    const warrantyDate = new Date(warrantyDateStr);
    const today = new Date();
    const diffTime = warrantyDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  }).length;

  const statistics = [
    {
      title: 'Total Assets',
      value: totalAssets.toString(),
      trend: 'All',
      icon: Laptop,
      color: '#33a8d9',
    },
    {
      title: 'Active Assets',
      value: activeAssets.toString(),
      trend: 'Working',
      icon: CheckCircle,
      color: '#33a8d9',
    },
    {
      title: 'In Maintenance',
      value: inMaintenance.toString(),
      trend: 'Repairing',
      icon: Wrench,
      color: '#33a8d9',
    },
    {
      title: 'Warranty Expiring',
      value: warrantyExpiringCount.toString(),
      trend: '< 30 days',
      icon: AlertTriangle,
      color: '#33a8d9',
    },
  ];

  // Asset Distribution Types
  const typeCounts = {};
  assets.forEach((a) => {
    const type = getAssetProperty(a, 'type') || 'Other';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  const generateColors = [
    '#33a8d9',
    '#004475',
    '#33a8d9cc',
    '#004475cc',
    '#33a8d999',
    '#00447599',
    '#14B8A6',
  ];
  const assetDistribution = Object.keys(typeCounts)
    .sort((a, b) => typeCounts[b] - typeCounts[a])
    .slice(0, 5) // top 5
    .map((type, i) => ({
      type: type,
      percentage:
        totalAssets > 0
          ? Math.round((typeCounts[type] / totalAssets) * 100)
          : 0,
      color: generateColors[i % generateColors.length],
    }));

  const alerts = [];
  if (warrantyExpiringCount > 0) {
    alerts.push({
      type: 'warning',
      message: `${warrantyExpiringCount} assets warranty expiring in 30 days`,
    });
  }
  if (inMaintenance > 0) {
    alerts.push({
      type: 'info',
      message: `${inMaintenance} assets currently in maintenance`,
    });
  }
  if (alerts.length === 0) {
    alerts.push({ type: 'info', message: 'All systems looking good' });
  }

  // Calculate generic latest activities based on latest additions
  const sortedByLatest = [...assets]
    .filter((a) => a.purchaseDate || a.__raw?.createdAt)
    .sort((a, b) => {
      const dateA = new Date(a.__raw?.createdAt || a.purchaseDate);
      const dateB = new Date(b.__raw?.createdAt || b.purchaseDate);
      return dateB - dateA;
    });

  const recentActivities = sortedByLatest.slice(0, 10).map((a) => ({
    action: 'Added',
    asset: a.assetTag || a.tag || 'Unknown',
    user: 'Admin',
    time: a.purchaseDate
      ? new Date(a.purchaseDate).toLocaleDateString()
      : 'Recently',
  }));

  // Mock departments for now since we don't have deep assigning info hooked up here perfectly
  const departments = [
    { department: 'Engineering', percentage: 36 },
    { department: 'Sales', percentage: 18 },
    { department: 'Marketing', percentage: 13 },
    { department: 'Finance', percentage: 11 },
  ];

  const kpis = [
    {
      metric: 'Asset Utilization',
      percentage:
        totalAssets > 0
          ? Math.round(
              (assets.filter(
                (a) => getAssetProperty(a, 'status') === 'Assigned'
              ).length /
                totalAssets) *
                100
            )
          : 0,
      target: '85%',
    },
    { metric: 'Maintenance Config', percentage: 100, target: '100%' },
    {
      metric: 'Active Assets',
      percentage:
        totalAssets > 0 ? Math.round((activeAssets / totalAssets) * 100) : 0,
      target: '90%',
    },
  ];

  const totalValue = assets.reduce(
    (sum, a) => sum + (Number(getAssetProperty(a, 'cost')) || 0),
    0
  );

  const financials = {
    totalValue: `₹${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    warrantySavings: '₹0.00',
    monthlyDepreciation: '₹0.00',
    maintenanceCost: '₹0.00',
  };

  const ProgressBar = ({ percentage, color }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="h-2 rounded-full"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      ></div>
    </div>
  );

  const AlertCard = ({ type, message }) => {
    const styles = {
      warning: 'border-yellow-400 bg-yellow-50 text-yellow-700',
      error: 'border-[#004475] bg-[#004475]/5 text-[#004475]',
      info: 'border-[#33a8d9] bg-[#33a8d9]/5 text-[#33a8d9]',
    };

    return (
      <div className={`p-4 rounded-lg border-l-4 ${styles[type]}`}>
        <p className="text-sm font-medium">{message}</p>
      </div>
    );
  };

  return (
    <div className="bg-transparent px-2.5 py-3">
      <div className="w-full">
        <div className="flex items-center justify-between"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statistics.map((stat, i) => (
            <div
              key={i}
              className="relative overflow-hidden bg-white py-3 rounded-[18px] border-t-4 shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer"
              style={{ borderTopColor: stat.color }}
            >
              {/* Premium Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

              <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
                <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  {stat.title}
                </span>
                <p className="text-[13px] text-gray-500 font-medium mb-4">
                  Current Status
                </p>
                <h3 className="text-[28px] font-bold text-[#004475] mb-5 transition-all duration-500 group-hover:scale-110">
                  {stat.value}
                </h3>
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
                  <stat.icon
                    size={14}
                    className="text-[#33a8d9] group-hover:text-white transition-colors"
                  />
                  <span className="text-[12px] font-semibold text-[#004475] group-hover:text-white">
                    {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Asset Distribution</h3>
              <div className="space-y-4">
                {assetDistribution.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>{item.type}</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <ProgressBar
                      percentage={item.percentage}
                      color={item.color}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm border-gray-200">
              <h3 className="text-lg font-semibold mb-4">
                Alerts & Notifications
              </h3>
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <AlertCard key={i} {...alert} />
                ))}
              </div>
            </div>

            {/* <div className="bg-white p-6 rounded-xl border shadow-sm border-gray-200">
              <h3 className="text-lg font-semibold mb-4">
                Department Distribution
              </h3>
              <div className="space-y-4">
                {departments.map((dept, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm">
                      <span>{dept.department}</span>
                      <span>{dept.percentage}%</span>
                    </div>
                    <ProgressBar percentage={dept.percentage} color="#33a8d9" />
                  </div>
                ))}
              </div>
            </div> */}
            <div className="bg-white p-6 rounded-xl border shadow-sm border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-[#33a8d9]/5 rounded-xl border border-[#33a8d9]/10">
                  <p className="text-2xl font-bold text-[#33a8d9]">
                    {financials.totalValue}
                  </p>
                  <p className="text-sm text-gray-600">Total Asset Value</p>
                </div>
                <div className="text-center p-4 bg-[#004475]/5 rounded-xl border border-[#004475]/10">
                  <p className="text-2xl font-bold text-[#004475]">
                    {financials.warrantySavings}
                  </p>
                  <p className="text-sm text-gray-600">Warranty Savings</p>
                </div>
                <div className="text-center p-4 bg-[#33a8d9]/5 rounded-xl border border-[#33a8d9]/10">
                  <p className="text-2xl font-bold text-[#33a8d9]">
                    {financials.monthlyDepreciation}
                  </p>
                  <p className="text-sm text-gray-600">Monthly Depreciation</p>
                </div>
                <div className="text-center p-4 bg-[#004475]/5 rounded-xl border border-[#004475]/10">
                  <p className="text-2xl font-bold text-[#004475]">
                    {financials.maintenanceCost}
                  </p>
                  <p className="text-sm text-gray-600">Maintenance Cost</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {recentActivities.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className="w-2 h-2 mt-2 rounded-full"
                      style={{ backgroundColor: '#33a8d9' }}
                    ></div>
                    <div>
                      <p className="text-sm font-medium">{r.asset}</p>
                      <p className="text-xs text-gray-600">
                        {r.action} by {r.user}
                      </p>
                      <p className="text-xs text-gray-500">{r.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm border-gray-200">
              <h3 className="text-lg font-semibold mb-4">
                Key Performance Indicators
              </h3>
              <div className="space-y-4">
                {kpis.map((k, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>{k.metric}</span>
                      <span>
                        {k.percentage}% / {k.target}
                      </span>
                    </div>
                    <ProgressBar percentage={k.percentage} color="#004475" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
