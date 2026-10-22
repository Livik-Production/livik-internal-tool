'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Hash } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../Toast';
import Loader from '../Loader';
import ConfirmDialog from '../ConfirmDialog';

export default function SequencesTab() {
  const [sequences, setSequences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resettingModule, setResettingModule] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const fetchSequences = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sequences');
      if (!res.ok) throw new Error('Failed to load sequences');
      const data = await res.json();
      setSequences(data);
    } catch (err) {
      showErrorToast(err.message || 'Failed to load sequences');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSequences();
  }, []);

  const openResetConfirm = (seq) => {
    setConfirmTarget(seq);
    setConfirmOpen(true);
  };

  const performReset = async () => {
    const seq = confirmTarget;
    if (!seq) {
      setConfirmOpen(false);
      return;
    }

    try {
      setResettingModule(seq.module);
      const res = await fetch('/api/sequences/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: seq.module }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || 'Failed to reset sequence');
      }
      const result = await res.json();
      showSuccessToast(result.message || 'Sequence reset successfully');
      await fetchSequences();
    } catch (err) {
      showErrorToast(err.message || 'Failed to reset sequence');
    } finally {
      setResettingModule(null);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader label="Loading sequence status..." size="md" fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">Use with caution</p>
          <p>
            Deleting a record never reuses its ID number by default — this is
            intentional and safe. Only reset a sequence here if a record was
            just created by mistake and immediately deleted, and you're sure
            its ID was never referenced anywhere else (documents, emails,
            other records). Resetting snaps the counter down to exactly
            &quot;highest ID currently in use + 1&quot; — it will never go
            below a number that is still in use.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sequences.map((seq) => (
          <div
            key={seq.module}
            className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-50 text-[#33a8d9] rounded-lg">
                <Hash size={16} />
              </div>
              <h3 className="font-semibold text-gray-900">{seq.label}</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-500 text-xs">Highest ID in use</div>
                <div className="font-semibold text-gray-900">
                  {seq.highestUsed}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-500 text-xs">Next number issued</div>
                <div
                  className={`font-semibold ${
                    seq.hasGap ? 'text-red-600' : 'text-gray-900'
                  }`}
                >
                  {seq.nextWouldBe}
                </div>
              </div>
            </div>

            {seq.hasGap ? (
              <div className="text-xs text-red-600 mb-3">
                Gap detected — {seq.nextWouldBe - seq.safeNextAfterReset} number
                {seq.nextWouldBe - seq.safeNextAfterReset > 1 ? 's' : ''} skipped.
                Resetting will make the next ID {seq.safeNextAfterReset}.
              </div>
            ) : (
              <div className="text-xs text-green-600 mb-3">
                No gap — sequence is already at the safe minimum.
              </div>
            )}

            <button
              type="button"
              onClick={() => openResetConfirm(seq)}
              disabled={!seq.hasGap || resettingModule === seq.module}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                seq.hasGap
                  ? 'bg-[#004475] text-white hover:bg-[#003258]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw
                size={14}
                className={resettingModule === seq.module ? 'animate-spin' : ''}
              />
              Reset Sequence
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Reset Sequence"
        destructive
        description={
          confirmTarget
            ? `Reset the ${confirmTarget.label} sequence? The next ${confirmTarget.label} issued will be number ${confirmTarget.safeNextAfterReset}. Only do this if the skipped number${
                confirmTarget.nextWouldBe - confirmTarget.safeNextAfterReset > 1
                  ? 's were'
                  : ' was'
              } never used anywhere.`
            : ''
        }
        confirmLabel="Reset"
        loading={resettingModule === confirmTarget?.module}
        onConfirm={performReset}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
    </div>
  );
}
