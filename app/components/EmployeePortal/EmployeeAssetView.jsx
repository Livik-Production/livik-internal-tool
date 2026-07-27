'use client';

import React, { useState, useEffect } from 'react';
import AssetDetailsTab from './AssetDetailsTab';
import Loader from '../Loader';

export default function EmployeeAssetView({ employeeId, initialAssignments = [] }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [isLoading, setIsLoading] = useState(!initialAssignments || initialAssignments.length === 0);

  useEffect(() => {
    if (initialAssignments && initialAssignments.length > 0) {
      setAssignments(initialAssignments);
      setIsLoading(false);
      return;
    }

    if (!employeeId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchAssets = async () => {
      try {
        setIsLoading(true);
        // Fetch all assignments and filter by employee to avoid ID format mismatches (CUID vs empId)
        const res = await fetch('/api/asset-assignment');
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            const allAssignments = json.data || [];
            const empAssignments = allAssignments.filter(
              (a) => a.employeeId === employeeId || a.employee?.empId === employeeId || a.employee?.id === employeeId
            );
            setAssignments(empAssignments);
          }
        } else {
            console.error("Failed to fetch assets, status:", res.status);
            if (isMounted) setAssignments([]);
        }
      } catch (err) {
        console.error("Failed to fetch assets:", err);
        if (isMounted) setAssignments([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAssets();

    return () => {
      isMounted = false;
    };
  }, [employeeId, initialAssignments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader label="Loading assigned assets..." size="md" />
      </div>
    );
  }

  return <AssetDetailsTab assignments={assignments} />;
}
