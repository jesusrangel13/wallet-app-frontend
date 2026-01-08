import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

interface UseVoiceRecognitionReturn {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    isSupported: boolean;
    error: string | null;
    interimTranscript: string;
}

export const useVoiceRecognition = (): UseVoiceRecognitionReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window.webkitSpeechRecognition || window.SpeechRecognition)) {
            setIsSupported(true);
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Keep listening until stopped
            recognitionRef.current.interimResults = true; // Show results as we speak
            recognitionRef.current.lang = 'es-CL'; // Chilean Spanish

            recognitionRef.current.onresult = (event: any) => {
                let interim = '';
                let finalChunk = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalChunk += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }

                if (finalChunk) {
                    setTranscript(prev => (prev + ' ' + finalChunk).trim());
                    setInterimTranscript('');
                } else {
                    setInterimTranscript(interim);
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech Recognition Error', event.error);
                setError(event.error);
                setIsListening(false);
            };
        }
    }, []);

    const startListening = useCallback(async () => {
        if (recognitionRef.current && !isListening) {
            setError(null);
            try {
                // Determine if we need to ask for permission using getUserMedia
                // This forces the "Allow Microphone" prompt if not already granted/denied.
                // We stop the stream immediately as we only need the permission for SpeechRecognition.
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());

                recognitionRef.current.start();
                setIsListening(true);
            } catch (e: any) {
                console.error("Microphone permission failed or start failed", e);
                if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                    setError('not-allowed');
                } else {
                    setError('unknown-start-error');
                }
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        isSupported,
        error,
        interimTranscript
    };
};
