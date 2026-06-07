import { Newspaper } from "lucide-react";
import AlertsTimeline from "../features/dashboard/components/AlertsTimeline";

export default function News() {
  return (
    <div className="space-y-6">

      {/* Hero */}

      <div
        className="
        rounded-3xl
        bg-gradient-to-br
        from-blue-600
        via-cyan-500
        to-teal-500
        p-8
        text-white
        shadow-xl
        "
      >
        <div className="flex items-center gap-4">

          <div className="p-4 rounded-2xl bg-white/10">
            <Newspaper className="h-10 w-10" />
          </div>

          <div>
            <h1 className="text-4xl font-bold">
              Live Market News
            </h1>

            <p className="mt-2 text-white/80">
              Real-time news aggregated from
              Finnhub and Google News.
            </p>
          </div>

        </div>
      </div>

      {/* Feed */}

      <AlertsTimeline fullPage />

    </div>
  );
}