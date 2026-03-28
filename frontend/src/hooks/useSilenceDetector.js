import { useEffect, useRef, useCallback } from "react";

/**
 * useSilenceDetector
 *
 * Manages the Web Audio API pipeline for monitoring microphone silence.
 * Uses RMS (Root Mean Square) amplitude to determine when the user is silent.
 *
 * Silence rules (unchanged from original):
 *  - RMS < 0.01               → treated as silence
 *  - Continuous silence > 800ms → counted as a "long silence"
 *
 * Only active when voice chat is running (isActive === true).
 * Automatically pauses accumulation when inputMode switches to "text".
 *
 * @param {object}  params
 * @param {boolean} params.isActive   - Whether voice chat is currently active
 * @param {string}  params.inputMode  - "voice" | "text"
 */
export function useSilenceDetector({ isActive, inputMode }) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  // Silence tracking refs (read by useInterviewLifecycle for summary)
  const silenceStartRef = useRef(null);
  const totalSilenceDurationRef = useRef(0);
  const longSilenceCountRef = useRef(0);

  // Stable ref so the rAF loop always reads latest inputMode
  const inputModeRef = useRef(inputMode);
  useEffect(() => {
    inputModeRef.current = inputMode;
  }, [inputMode]);

  // ─── rAF Analysis Loop ────────────────────────────────────────────────────
  const monitorAudio = useCallback(() => {
    // Pause accumulation in text mode but keep loop alive so we resume on switch
    if (inputModeRef.current !== "voice") {
      requestAnimationFrame(monitorAudio);
      return;
    }

    if (!analyserRef.current) {
      requestAnimationFrame(monitorAudio);
      return;
    }

    analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);

    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i] * dataArrayRef.current[i];
    }
    const rms = Math.sqrt(sum / dataArrayRef.current.length);

    const SILENCE_THRESHOLD = 0.01;
    const LONG_SILENCE_MS = 800;
    const now = Date.now();

    if (rms < SILENCE_THRESHOLD) {
      // Start timing a new silence window
      if (!silenceStartRef.current) {
        silenceStartRef.current = now;
      }
    } else {
      // Silence window ended — accumulate
      if (silenceStartRef.current) {
        const silenceDuration = now - silenceStartRef.current;
        totalSilenceDurationRef.current += silenceDuration;

        if (silenceDuration > LONG_SILENCE_MS) {
          longSilenceCountRef.current += 1;
        }

        silenceStartRef.current = null;
      }
    }

    requestAnimationFrame(monitorAudio);
  }, []);

  // ─── Audio Pipeline Setup ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    let audioContext;

    const setupAudioAnalysis = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        monitorAudio();
      } catch (err) {
        console.warn("[useSilenceDetector] Microphone access failed:", err);
      }
    };

    setupAudioAnalysis();

    return () => {
      audioContext?.close();
      audioContextRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
    };
  }, [isActive, monitorAudio]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // ─── Utility: reset counters (e.g., on manual voice stop) ────────────────
  const resetSilence = useCallback(() => {
    silenceStartRef.current = null;
    totalSilenceDurationRef.current = 0;
    longSilenceCountRef.current = 0;
  }, []);

  return {
    totalSilenceDurationRef,
    longSilenceCountRef,
    resetSilence,
  };
}
