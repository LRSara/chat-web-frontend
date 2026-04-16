import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  src: string;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(animRef.current);
      return;
    }
    const tick = () => {
      const audio = audioRef.current;
      if (audio && Number.isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing]);

  const trySetDuration = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    } else {
      // Chrome bug: blob audio do MediaRecorder retorna Infinity.
      const onSeeked = () => {
        audio.removeEventListener("seeked", onSeeked);
        audio.currentTime = 0;
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
      };
      audio.addEventListener("seeked", onSeeked);
      audio.currentTime = 1e10;
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(audio.currentTime)) {
      setCurrentTime(audio.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * duration;
    },
    [duration]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={trySetDuration}
        onCanPlay={trySetDuration}
        onEnded={handleEnded}
        preload="auto"
      />

      <Button
        variant="outline"
        size="icon-sm"
        onClick={togglePlay}
        aria-label={playing ? "Pausar" : "Reproduzir"}
      >
        {playing ? "⏸" : "▶"}
      </Button>

      <div
        className="relative h-2 flex-1 cursor-pointer rounded-full bg-muted"
        onClick={handleSeek}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="text-muted-foreground text-xs tabular-nums">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}
