import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImagePreviewProps {
  src: string;
  alt?: string;
}

export function ImagePreview({ src, alt = "Imagem" }: ImagePreviewProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block max-w-52 cursor-pointer overflow-hidden rounded-lg"
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-auto w-full object-cover"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <img
            src={src}
            alt={alt}
            className="h-auto w-full rounded-lg object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
