import {
  Plus,
  Minus,
  RotateCcw,
} from "lucide-react";

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export default function ChartControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: Props) {
  return (
    <div
      className="
      absolute
      top-4
      right-4
      flex
      gap-2
      z-20
      "
    >
      <button onClick={onZoomIn}>
        <Plus />
      </button>

      <button onClick={onZoomOut}>
        <Minus />
      </button>

      <button onClick={onReset}>
        <RotateCcw />
      </button>
    </div>
  );
}