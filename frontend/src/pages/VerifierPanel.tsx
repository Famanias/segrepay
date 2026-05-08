/**
 * Verifier Panel Page
 * EcoVerifiers use this to submit waste deposits for citizens
 * 
 * API Integration:
 * - POST /deposits -> segRewards.rewardDeposit()
 * - GET /verifier/:address/status -> segRewards.isVerifier()
 */

import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAppStore } from '@/stores/appStore';
import { submitDeposit } from '@/services/contracts';
import type { WasteCategory } from '@/types';
import { LoadingSpinner } from '@/components/Layout';
import { DEMO_HOUSEHOLDS } from '@/utils/demoData';
import { QRCodeSVG } from 'qrcode.react';

interface DepositFormData {
  citizenAddress: string;
  barangayId: number;
  wasteCategory: WasteCategory;
  kg: number;
}

const WASTE_CATEGORIES: { value: WasteCategory; label: string; icon: string }[] = [
  { value: 'biodegradable', label: 'Biodegradable', icon: '🍃' },
  { value: 'recyclable', label: 'Recyclable', icon: '♻️' },
  { value: 'residual', label: 'Residual', icon: '🗑️' },
];

const BARANGAYS = [
  { id: 1, name: 'Barangay 1 (East Bajac-bajac)' },
  { id: 2, name: 'Barangay 2 (West Bajac-bajac)' },
  { id: 3, name: 'Barangay 3 (New Kababae)' },
  { id: 4, name: 'Barangay 4 (Old Cabalan)' },
  { id: 5, name: 'Barangay 5 (New Cabalan)' },
  { id: 6, name: 'Barangay 6 (New Ilalim)' },
  { id: 7, name: 'Barangay 7 (Old Ilalim)' },
  { id: 8, name: 'Barangay 8 (Sta. Rita)' },
  { id: 9, name: 'Barangay 9 (East Bajac-bajac)' },
  { id: 10, name: 'Barangay 10 (West Tapinac)' },
  { id: 11, name: 'Barangay 11 (East Tapinac)' },
  { id: 12, name: 'Barangay 12 (Gordon Heights)' },
  { id: 13, name: 'Barangay 13 (Mabayuan)' },
  { id: 14, name: 'Barangay 14 (Kalaklan)' },
  { id: 15, name: 'Barangay 15 (Asinan)' },
  { id: 16, name: 'Barangay 16 (Banicain)' },
  { id: 17, name: 'Barangay 17 (West Bajac-bajac)' },
];

export function VerifierPanel() {
  const { isConnected, isVerifier, address } = useWallet();
  const { showSuccess, showError, showInfo } = useAppStore();
  
  const [formData, setFormData] = useState<DepositFormData>({
    citizenAddress: '',
    barangayId: 1,
    wasteCategory: 'recyclable',
    kg: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<string | null>(null);

  // Not connected
  if (!isConnected) {
    return (
      <div className="card text-center py-16">
        <p className="text-segre-ink-3">Connect your wallet to access the Verifier Panel</p>
      </div>
    );
  }

  // Not a verifier
  if (!isVerifier) {
    return (
      <div className="card text-center py-16">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="font-serif text-xl text-segre-ink mb-2">Access Denied</h2>
        <p className="text-segre-ink-2 max-w-md mx-auto">
          This wallet is not authorized as an EcoVerifier. Only designated 
          MRF operators can submit waste deposits.
        </p>
        <p className="mt-4 text-sm text-segre-ink-3 font-mono">
          Address: {address}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.citizenAddress || !formData.kg) {
      showError('Missing Fields', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    const result = await submitDeposit(
      formData.citizenAddress,
      formData.barangayId,
      formData.wasteCategory,
      formData.kg
    );

    setIsSubmitting(false);

    if (result.success) {
      showSuccess(
        'Deposit Submitted',
        `${formData.kg}kg of ${formData.wasteCategory} waste recorded. ${formData.kg * 10} ECO tokens minted!`
      );
      
      // Reset form
      setFormData({
        citizenAddress: '',
        barangayId: 1,
        wasteCategory: 'recyclable',
        kg: 1,
      });
      setSelectedHousehold(null);
    } else {
      showError('Submission Failed', result.error || 'Transaction failed');
    }
  };

  const selectHousehold = (householdId: string) => {
    const household = DEMO_HOUSEHOLDS.find((h) => h.id === householdId);
    if (household) {
      setSelectedHousehold(householdId);
      setFormData((prev) => ({
        ...prev,
        citizenAddress: household.address,
        barangayId: household.barangayId,
      }));
      showInfo('Household Selected', `${household.name} - ${household.barangayName}`);
    }
  };

  const expectedReward = formData.kg * 10;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="eyebrow">Verifier Panel</p>
        <h2 className="section-title">Log Waste Deposit</h2>
        <p className="text-segre-ink-2 mt-2">
          Scan a household QR code or enter their wallet address to record a waste deposit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card space-y-6">
            {/* Citizen Address */}
            <div>
              <label className="block text-sm font-medium text-segre-ink mb-2">
                Citizen Wallet Address *
              </label>
              <input
                type="text"
                value={formData.citizenAddress}
                onChange={(e) => setFormData({ ...formData, citizenAddress: e.target.value })}
                placeholder="0x..."
                className="input-field font-mono text-sm"
                required
              />
              {selectedHousehold && (
                <p className="mt-1 text-sm text-segre-green">
                  Selected: {DEMO_HOUSEHOLDS.find((h) => h.id === selectedHousehold)?.name}
                </p>
              )}
            </div>

            {/* Barangay Selection */}
            <div>
              <label className="block text-sm font-medium text-segre-ink mb-2">
                Barangay *
              </label>
              <select
                value={formData.barangayId}
                onChange={(e) => setFormData({ ...formData, barangayId: Number(e.target.value) })}
                className="input-field"
                required
              >
                {BARANGAYS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Waste Category */}
            <div>
              <label className="block text-sm font-medium text-segre-ink mb-2">
                Waste Category *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {WASTE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, wasteCategory: cat.value })}
                    className={`
                      p-4 rounded-lg border-2 text-center transition-all
                      ${formData.wasteCategory === cat.value
                        ? 'border-segre-green bg-segre-green-bg text-segre-green'
                        : 'border-segre-rule bg-segre-card hover:border-segre-green/50'
                      }
                    `}
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div className="text-sm font-medium">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Weight Input */}
            <div>
              <label className="block text-sm font-medium text-segre-ink mb-2">
                Weight (kg) *
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.kg}
                  onChange={(e) => setFormData({ ...formData, kg: Number(e.target.value) })}
                  className="input-field w-32"
                  required
                />
                <span className="text-segre-ink-2">kilograms</span>
              </div>
            </div>

            {/* Reward Preview */}
            <div className="bg-segre-green-bg rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-segre-ink-2">Expected Reward:</span>
                <span className="font-serif text-2xl text-segre-green">
                  {expectedReward} ECO
                </span>
              </div>
              <p className="text-sm text-segre-ink-3 mt-1">
                {formData.kg} kg × 10 ECO/kg = {expectedReward} ECO
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Submitting to Blockchain...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>⛓️</span>
                  Submit Deposit
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Demo Households Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-serif text-lg text-segre-ink mb-4">Demo Households</h3>
            <p className="text-sm text-segre-ink-3 mb-4">
              Click a household to auto-fill their address
            </p>
            
            <div className="space-y-3">
              {DEMO_HOUSEHOLDS.map((household) => (
                <button
                  key={household.id}
                  onClick={() => selectHousehold(household.id)}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-all
                    ${selectedHousehold === household.id
                      ? 'border-segre-green bg-segre-green-bg'
                      : 'border-segre-rule hover:border-segre-green/50'
                    }
                  `}
                >
                  <div className="font-medium text-sm">{household.name}</div>
                  <div className="text-xs text-segre-ink-3 font-mono">
                    {household.address.slice(0, 10)}...{household.address.slice(-8)}
                  </div>
                  <div className="text-xs text-segre-ink-3 mt-1">
                    {household.barangayName}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* QR Codes */}
          <div className="card">
            <h3 className="font-serif text-lg text-segre-ink mb-4">QR Codes</h3>
            <div className="space-y-4">
              {DEMO_HOUSEHOLDS.slice(0, 3).map((household) => (
                <div key={household.id} className="text-center">
                  <div className="bg-white p-3 rounded-lg inline-block">
                    <QRCodeSVG
                      value={household.address}
                      size={100}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-segre-ink-3 mt-1">{household.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
