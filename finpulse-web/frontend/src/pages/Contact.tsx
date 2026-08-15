import { Mail, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Contact FinPulse Support
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Our engineering and support desks are available to help you configure APIs or manage billing cycles.
        </p>
      </div>

      {/* Main Grid / Centered layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Email Channels Card */}
        <div className="glass-panel p-8 space-y-4 hover:shadow-lg transition-all duration-300 border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Email Channels</h3>
          </div>
          <div className="space-y-2 pt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              General Support: <br />
              <a href="mailto:afinpulseai@gmail.com" className="font-bold text-blue-600 dark:text-cyan-400 hover:underline">afinpulseai@gmail.com</a>
            </p>
          </div>
        </div>

        {/* Office Locations Card */}
        <div className="glass-panel p-8 space-y-4 hover:shadow-lg transition-all duration-300 border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Office Locations</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
            <strong>FinPulse AI Technologies Inc.</strong><br />
            Sector 16, Panchkula, Haryana
          </p>
        </div>
      </div>
    </div>
  );
}
