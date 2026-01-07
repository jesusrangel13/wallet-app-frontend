"use client";

import React, { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { voiceAPI, ParsedVoiceTransaction } from '@/lib/voiceApi';
import { transactionAPI } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VoiceCorrectionModal } from './VoiceCorrectionModal';

import { useAccounts } from '@/hooks/useAccounts';

export const VoiceButton = () => {
  const { isListening, transcript, interimTranscript, startListening, stopListening, isSupported, resetTranscript, error: voiceError } = useVoiceRecognition();
  const { data: accountsData } = useAccounts();
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedVoiceTransaction | null>(null);

  // Ref to track if we manually stopped to trigger processing
  const shouldProcessRef = React.useRef(false);

  React.useEffect(() => {
    if (voiceError) {
      if (voiceError === 'not-allowed') {
        toast.error("Access Denied", {
          description: "Microphone permission was denied. Please allow access in settings."
        });
      } else if (voiceError === 'service-not-allowed') {
        toast.error("Service Unavailable", {
          description: "Speech service blocked. Try standard Chrome/Edge or check network/HTTPS."
        });
      } else {
        toast.error("Voice Recognition Error", { description: voiceError });
      }
      shouldProcessRef.current = false; // Don't process on error
    }
  }, [voiceError]);

  // Effect to handle processing when listening stops
  React.useEffect(() => {
    if (!isListening && shouldProcessRef.current) {
      shouldProcessRef.current = false;
      // Check both final transcript and interim if it somehow got stuck (though interim clears on stop)
      // But mainly rely on transcript.
      if (transcript && transcript.trim().length > 2) {
        handleProcess(transcript);
      }
    }
  }, [isListening, transcript]);

  // Helper to get default account ID
  const defaultAccountId = (accountsData as any)?.data?.data?.[0]?.id || (accountsData as any)?.data?.[0]?.id;

  const handleToggle = async () => {
    if (isListening) {
      shouldProcessRef.current = true; // Mark intent to process
      stopListening();
    } else {
      shouldProcessRef.current = false;
      resetTranscript();
      startListening();
    }
  };

  const saveTransaction = async (data: ParsedVoiceTransaction) => {
    try {
      await transactionAPI.create({
        amount: data.amount,
        description: data.merchant || 'Voice Transaction',
        categoryId: data.resolvedCategoryId || undefined,
        // For MVP, if no categoryId, maybe we fail or default?
        // Assuming backend allows null category OR we force user to select in modal if missing.
        date: data.date,
        type: 'EXPENSE', // Defaulting to expense for MVP
        accountId: data.resolvedAccountId || defaultAccountId, // Use resolved account from Voice/Modal or default
        currency: data.currency,
        tagIds: (data as any).tagIds // Pass tags from modal
      } as any);
      toast.success("Transaction saved!", {
        action: {
          label: "Edit",
          onClick: () => {
            // Re-open modal with data
            setParsedData(data); // Ensures data is available
            setModalOpen(true);
          }
        }
      });
    } catch (e) {
      toast.error("Failed to save transaction");
    }
  };

  const handleProcess = async (text: string) => {
    if (!text || text.trim().length < 3) return;

    setIsProcessing(true);
    try {
      const response = await voiceAPI.parse(text);
      if (response.data.success && response.data.data) {
        const result = response.data.data;
        setParsedData(result);

        if (result.confidence > 0.85 && result.amount && result.merchant && result.resolvedCategoryId) {
          // High confidence: Open modal for confirmation (User Request)
          setParsedData(result);
          setModalOpen(true);

          // Legacy Auto-save logic removed per user request
          /*
          toast("Transaction Recognized", {
            description: `${result.amount} ${result.currency} at ${result.merchant} (${result.category})`,
            action: {
              label: "Undo",
              onClick: () => console.log("Undo logic implementation needed")
            },
            duration: 4000
          });
          await saveTransaction(result);
          */
        } else {
          // Low confidence or missing data: specific prompt
          setModalOpen(true);
        }
      }
    } catch (e) {
      console.error("Processing error", e);
      toast.error("Failed to process voice transaction");
    } finally {
      setIsProcessing(false);
    }
  }

  if (!isSupported) return null;

  // Combine final and interim for display
  const displayTranscript = (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim();

  return (
    <>
      {isListening && displayTranscript && (
        <div className="fixed bottom-24 right-6 p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg max-w-xs z-50 border border-gray-200">
          <p className="text-sm text-gray-700 font-medium animate-pulse">
            {displayTranscript}
          </p>
        </div>
      )}
      <button
        onClick={handleToggle}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-full shadow-xl transition-all duration-300 z-50",
          isListening ? "bg-red-500 hover:bg-red-600 scale-110 animate-pulse" : "bg-blue-600 hover:bg-blue-700",
          isProcessing && "bg-zinc-500 cursor-wait"
        )}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : isListening ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>

      <VoiceCorrectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={parsedData}
        onSave={saveTransaction}
      />
    </>
  );
};
