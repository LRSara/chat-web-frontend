import { useEffect, useRef } from "react";

const BAR_COUNT = 32;

interface AudioWaveformProps {
  stream: MediaStream | null;
}

export function AudioWaveform({ stream }: AudioWaveformProps) {
  const barsRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stream) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = BAR_COUNT * 4;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      const bars: number[] = [];
      const step = Math.floor(dataArray.length / BAR_COUNT);
      for (let i = 0; i < BAR_COUNT; i++) {
        bars.push(dataArray[i * step] / 255);
      }
      barsRef.current = bars;

      const children = containerRef.current?.children;
      if (children) {
        for (let i = 0; i < children.length; i++) {
          const height = Math.max(4, bars[i] * 32);
          (children[i] as HTMLElement).style.height = `${height}px`;
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      source.disconnect();
      audioCtx.close();
    };
  }, [stream]);

  return (
    <div ref={containerRef} className="flex items-center gap-[2px]">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-primary transition-[height] duration-75"
          style={{ height: "4px" }}
        />
      ))}
    </div>
  );
}
