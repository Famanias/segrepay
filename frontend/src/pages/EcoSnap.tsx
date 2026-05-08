/**
 * EcoSnap Page
 * AI-powered waste verification through photo upload
 * Citizens earn ECO tokens by submitting photos of properly segregated waste
 * 
 * Reward Rate: 7 ECO/kg (vs 10 ECO/kg at physical MRF)
 */

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAppStore } from '@/stores/appStore';
import { submitEcoSnap, formatTokenAmount, isMockMode } from '@/services/contracts';
import type { WasteCategory } from '@/types';
import { LoadingSpinner } from '@/components/Layout';

// Eco tips for successful submissions
const ECO_TIPS: Record<WasteCategory, string[]> = {
  recyclable: [
    'Rinse plastic containers before recycling to prevent contamination.',
    'Flatten cardboard boxes to save space in recycling bins.',
    'Remove caps from bottles — they\'re often made of different plastics.',
    'Check the recycling number on plastics — not all are recyclable.',
  ],
  biodegradable: [
    'Compost coffee grounds and eggshells for nutrient-rich soil.',
    'Avoid putting meat or dairy in home compost — it attracts pests.',
    'Layer "green" waste (food scraps) with "brown" waste (dry leaves).',
    'Turn your compost regularly to speed up decomposition.',
  ],
  residual: [
    'Many "residual" items can be repurposed before disposal.',
    'Check if broken items can be repaired instead of thrown away.',
    'Some retailers offer take-back programs for hard-to-recycle items.',
    'Consider if the item could be donated or sold secondhand.',
  ],
  hazardous: [
    'Never pour chemicals down the drain — use designated drop-off centers.',
    'Store hazardous waste in original containers with labels intact.',
    'Batteries and electronics should go to e-waste collection points.',
    'Check local guidelines for proper hazardous waste disposal.',
  ],
};

// AI analysis steps for animation
const ANALYSIS_STEPS = [
  { id: 1, text: 'Checking image quality...', icon: '📸' },
  { id: 2, text: 'Detecting waste category...', icon: '🔍' },
  { id: 3, text: 'Running duplicate scan...', icon: '📋' },
  { id: 4, text: 'Calculating fraud score...', icon: '🛡️' },
  { id: 5, text: 'Verifying segregation...', icon: '✓' },
  { id: 6, text: 'Calculating ECO reward...', icon: '🪙' },
];

interface EcoSnapSubmission {
  id: string;
  imageUrl: string;
  category: WasteCategory;
  weight: number;
  confidence: number;
  ecoEarned: bigint;
  txHash: string;
  timestamp: number;
  tip: string;
}

export function EcoSnap() {
  const { address, isConnected } = useWallet();
  const { showSuccess, showError } = useAppStore();

  // Form state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [category, setCategory] = useState<WasteCategory>('recyclable');
  const [weight, setWeight] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Result state
  const [submissionResult, setSubmissionResult] = useState<EcoSnapSubmission | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('File Too Large', 'Please select an image under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulate AI analysis
  const simulateAnalysis = async (): Promise<{
    confidence: number;
    detectedCategory: WasteCategory;
    fraudScore: number;
    approved: boolean;
  }> => {
    const steps = ANALYSIS_STEPS.length;
    
    for (let i = 0; i < steps; i++) {
      setCurrentStep(i);
      // Random delay between 800ms and 1500ms for each step
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));
    }

    // Generate realistic AI results
    const confidence = 85 + Math.floor(Math.random() * 14); // 85-99%
    const fraudScore = Math.floor(Math.random() * 15); // 0-14 (low is good)
    
    // 95% approval rate for demo, but reject if clearly mismatched
    const categoryMismatch = Math.random() > 0.9;
    const approved = !categoryMismatch && fraudScore < 20;

    return {
      confidence,
      detectedCategory: category,
      fraudScore,
      approved,
    };
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedImage) {
      showError('Missing Image', 'Please upload a photo of your waste');
      return;
    }

    if (!isConnected || !address) {
      showError('Wallet Not Connected', 'Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    setIsAnalyzing(true);
    setCurrentStep(0);

    try {
      // Step 1: AI Analysis
      const analysis = await simulateAnalysis();

      if (!analysis.approved) {
        setIsAnalyzing(false);
        setIsSubmitting(false);
        showError(
          'Submission Rejected',
          'Our AI detected potential issues with this submission. Please ensure your waste is properly segregated and try again.'
        );
        return;
      }

      // Step 2: Submit to blockchain (or mock)
      const result = await submitEcoSnap(address, category, weight, selectedImage);

      if (result.success) {
        // Calculate ECO earned (7 per kg for EcoSnap)
        const ecoPerKg = 7;
        const ecoEarned = BigInt(weight * ecoPerKg) * BigInt(10 ** 18);

        // Select random tip for the category
        const tips = ECO_TIPS[analysis.detectedCategory];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        setSubmissionResult({
          id: `ecosnap-${Date.now()}`,
          imageUrl: selectedImage,
          category: analysis.detectedCategory,
          weight,
          confidence: analysis.confidence,
          ecoEarned,
          txHash: result.hash || '0x...',
          timestamp: Date.now(),
          tip: randomTip,
        });

        showSuccess(
          'EcoSnap Verified! 🌱',
          `You earned ${weight * ecoPerKg} ECO for ${weight}kg of ${analysis.detectedCategory} waste!`
        );
      } else {
        showError('Submission Failed', result.error || 'Please try again later');
      }
    } catch (error) {
      console.error('EcoSnap submission error:', error);
      showError('Submission Failed', 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
      setIsSubmitting(false);
    }
  };

  // Reset for another submission
  const handleSubmitAnother = () => {
    setSelectedImage(null);
    setCategory('recyclable');
    setWeight(3);
    setSubmissionResult(null);
    setCurrentStep(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Category options with icons
  const categories: { value: WasteCategory; label: string; icon: string; color: string }[] = [
    { value: 'recyclable', label: 'Recyclable', icon: '♻️', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'biodegradable', label: 'Biodegradable', icon: '🌿', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'residual', label: 'Residual', icon: '🗑️', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    { value: 'hazardous', label: 'Hazardous', icon: '⚠️', color: 'bg-red-100 text-red-700 border-red-300' },
  ];

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-6xl mb-4">📸</div>
        <h2 className="section-title">Connect Your Wallet</h2>
        <p className="text-segre-ink-3 mb-6">
          Please connect your wallet to use EcoSnap and earn ECO tokens for your waste segregation efforts.
        </p>
      </div>
    );
  }

  // Result Screen
  if (submissionResult) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="section-title mb-2">EcoSnap Verified!</h2>
          <p className="text-segre-ink-3">Your waste segregation has been AI-verified</p>
        </div>

        {/* Result Card */}
        <div className="card mb-6">
          {/* Image Preview */}
          <div className="relative mb-6 rounded-lg overflow-hidden bg-segre-bg-2">
            <img
              src={submissionResult.imageUrl}
              alt="Verified waste"
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2 badge-green">
              {submissionResult.confidence}% AI Confidence
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-segre-green-bg rounded-lg p-4 text-center">
              <p className="text-segre-green text-sm font-mono uppercase">Earned</p>
              <p className="font-serif text-2xl text-segre-green">
                {formatTokenAmount(submissionResult.ecoEarned)} ECO
              </p>
            </div>
            <div className="bg-segre-bg-2 rounded-lg p-4 text-center">
              <p className="text-segre-ink-3 text-sm font-mono uppercase">Weight</p>
              <p className="font-serif text-2xl text-segre-ink">{submissionResult.weight} kg</p>
            </div>
          </div>

          {/* Category & Details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center py-2 border-b border-segre-rule">
              <span className="text-segre-ink-3">Detected Category</span>
              <span className="badge-green capitalize">{submissionResult.category}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-segre-rule">
              <span className="text-segre-ink-3">Fraud Score</span>
              <span className="badge-green">Low (Safe)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-segre-rule">
              <span className="text-segre-ink-3">Transaction Hash</span>
              <a
                href={`https://testnet.snowtrace.io/tx/${submissionResult.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="badge-blue hover:opacity-80 transition-opacity font-mono text-xs"
              >
                {submissionResult.txHash.slice(0, 10)}...
              </a>
            </div>
          </div>

          {/* Eco Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm font-medium mb-1">💡 Eco Tip</p>
            <p className="text-blue-700 text-sm">{submissionResult.tip}</p>
          </div>

          {/* Rate Comparison Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              <span className="font-medium">ℹ️ Did you know?</span>
              <br />
              EcoSnap earns <strong>7 ECO/kg</strong>. Visit your local MRF for the full{' '}
              <strong>10 ECO/kg</strong> reward rate!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button onClick={handleSubmitAnother} className="btn-primary flex-1">
              📸 Submit Another
            </button>
            <button
              onClick={() => (window.location.href = '/')} // Will trigger dashboard tab
              className="btn-secondary flex-1"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Analyzing Screen
  if (isAnalyzing) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          {/* AI Brain Animation */}
          <div className="relative mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-segre-green-bg rounded-full">
              <span className="text-5xl animate-pulse">🧠</span>
            </div>
            {/* Orbiting dots */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32">
              <div className="absolute top-0 left-1/2 w-3 h-3 bg-segre-green rounded-full animate-ping" />
            </div>
          </div>

          <h2 className="section-title mb-2">AI Analyzing Your Waste...</h2>
          <p className="text-segre-ink-3 mb-8">
            Our AI is verifying your waste segregation
          </p>

          {/* Analysis Steps */}
          <div className="max-w-sm mx-auto space-y-3">
            {ANALYSIS_STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              const isPending = index > currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-50'
                      : isActive
                      ? 'bg-segre-green-bg border border-segre-green/30'
                      : 'bg-segre-bg-2 opacity-50'
                  }`}
                >
                  <span className="text-xl">{step.icon}</span>
                  <span
                    className={`flex-1 text-left ${
                      isCompleted
                        ? 'text-green-700 line-through'
                        : isActive
                        ? 'text-segre-green font-medium'
                        : 'text-segre-ink-3'
                    }`}
                  >
                    {step.text}
                  </span>
                  {isCompleted && (
                    <span className="text-green-600">✓</span>
                  )}
                  {isActive && (
                    <LoadingSpinner size="sm" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="max-w-sm mx-auto mt-6">
            <div className="h-2 bg-segre-bg-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-segre-green transition-all duration-500"
                style={{ width: `${((currentStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
              />
            </div>
            <p className="text-segre-ink-3 text-sm mt-2">
              Step {currentStep + 1} of {ANALYSIS_STEPS.length}
            </p>
          </div>

          {isMockMode() && (
            <p className="text-segre-ink-3 text-xs mt-6">🧪 Simulated AI analysis in demo mode</p>
          )}
        </div>
      </div>
    );
  }

  // Upload Form Screen
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Snap & Earn</p>
            <h2 className="section-title">EcoSnap</h2>
          </div>
          {isMockMode() && (
            <span className="badge-yellow text-xs">🧪 Demo Mode</span>
          )}
        </div>
        <p className="text-segre-ink-3 mt-2">
          Upload a photo of your properly segregated waste and earn ECO tokens instantly.
        </p>
      </div>

      <div className="card">
        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-segre-ink mb-2">
            📸 Upload Waste Photo
          </label>
          
          {selectedImage ? (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={selectedImage}
                alt="Selected waste"
                className="w-full h-64 object-cover"
              />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-segre-rule rounded-lg p-12 text-center cursor-pointer hover:bg-segre-bg-2 transition-colors"
            >
              <div className="text-4xl mb-3">📷</div>
              <p className="text-segre-ink font-medium mb-1">Tap to upload photo</p>
              <p className="text-segre-ink-3 text-sm">or drag and drop</p>
              <p className="text-segre-ink-3 text-xs mt-2">JPG, PNG up to 5MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Waste Category */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-segre-ink mb-3">
            🗂️ Waste Category
          </label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  category === cat.value
                    ? `${cat.color} border-current`
                    : 'bg-segre-card border-segre-rule hover:border-segre-green'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="font-medium text-sm">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Weight Slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-segre-ink mb-3">
            ⚖️ Estimated Weight: <span className="text-segre-green font-bold">{weight} kg</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full h-2 bg-segre-bg-2 rounded-lg appearance-none cursor-pointer accent-segre-green"
          />
          <div className="flex justify-between text-xs text-segre-ink-3 mt-1">
            <span>1 kg</span>
            <span>5 kg</span>
            <span>10 kg</span>
          </div>
        </div>

        {/* Reward Preview */}
        <div className="bg-segre-green-bg rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-segre-green text-sm font-mono uppercase">Estimated Reward</p>
              <p className="font-serif text-2xl text-segre-green">{weight * 7} ECO</p>
            </div>
            <div className="text-right">
              <p className="text-segre-green text-xs">Rate: 7 ECO/kg</p>
              <p className="text-segre-green/70 text-xs">via EcoSnap</p>
            </div>
          </div>
        </div>

        {/* Rate Comparison */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          <p className="text-amber-800 text-sm">
            💡 <strong>Pro tip:</strong> Visit your local MRF for the full{' '}
            <strong>10 ECO/kg</strong> reward rate!
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedImage || isSubmitting}
          className="btn-primary w-full py-4 text-lg"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Submitting...
            </span>
          ) : (
            '🚀 Submit for Verification'
          )}
        </button>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 mt-6 text-segre-ink-3 text-sm">
          <span className="flex items-center gap-1">
            <span>🛡️</span> AI Verified
          </span>
          <span className="flex items-center gap-1">
            <span>⚡</span> Instant Rewards
          </span>
          <span className="flex items-center gap-1">
            <span>🌱</span> Eco Friendly
          </span>
        </div>
      </div>
    </div>
  );
}
