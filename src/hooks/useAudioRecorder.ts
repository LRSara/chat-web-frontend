import { useState, useRef, useCallback } from "react";

const MAX_DURATION_MS = 120_000;

const AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
];

function getSupportedMimeType(): string {
  for (const type of AUDIO_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

interface AudioRecorderState {
  isRecording: boolean;
  duration: number;
  blob: Blob | null;
  mimeType: string;
  error: string | null;
  stream: MediaStream | null;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    duration: 0,
    blob: null,
    mimeType: "",
    error: null,
    stream: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>("");

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      cleanup();

      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const options: MediaRecorderOptions = {};
      if (mimeType) options.mimeType = mimeType;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const actualType = mediaRecorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualType });
        cleanup();
        setState((s) => ({
          ...s,
          isRecording: false,
          blob,
          mimeType: actualType,
        }));
      };

      mediaRecorder.start(100);
      startTimeRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        setState((s) => ({ ...s, duration: elapsed }));

        if (Date.now() - startTimeRef.current >= MAX_DURATION_MS) {
          stopRecording();
        }
      }, 100);

      setState({
        isRecording: true,
        duration: 0,
        blob: null,
        mimeType: "",
        error: null,
        stream,
      });
    } catch {
      setState((s) => ({
        ...s,
        error: "Permissão de microfone negada",
      }));
    }
  }, [cleanup, stopRecording]);

  const reset = useCallback(() => {
    cleanup();
    setState({
      isRecording: false,
      duration: 0,
      blob: null,
      mimeType: "",
      error: null,
      stream: null,
    });
  }, [cleanup]);

  return { ...state, startRecording, stopRecording, reset };
}
