import { useState } from "react";
import { Mail, MapPin, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", topic: "General Support", msg: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.msg) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSent(true);
    toast.success("Support ticket created successfully!");
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Contact FinPulse Support
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Our engineering and support desk are available to help you configure APIs or manage billing cycles.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Email Channels</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              General Support: <span className="font-bold">support@finpulse.ai</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enterprise Sales: <span className="font-bold">sales@finpulse.ai</span>
            </p>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Office Locations</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>Corporate Headquarters:</strong><br />
              FinPulse AI Technologies Inc.<br />
              BKC, Mumbai, Maharashtra 400051
            </p>
          </div>

        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 glass-panel p-8">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Support Ticket Submitted</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                We have registered support ticket #{Math.floor(100000 + Math.random() * 900000)}. Our engineering desk will respond within 4 hours.
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name: "", email: "", topic: "General Support", msg: "" }); }}
                className="mt-4 rounded-xl bg-blue-600 dark:bg-cyan-500 px-6 py-2.5 text-xs font-bold text-white dark:text-slate-950 hover:bg-blue-700 dark:hover:bg-cyan-400 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Enter email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Ticket Category</label>
                <select
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none appearance-none"
                >
                  <option>General Support</option>
                  <option>API & Developer Integration</option>
                  <option>Billing & Subscription Tiers</option>
                  <option>Bug Bounty & Vulnerabilities</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Message</label>
                <textarea
                  required
                  rows={4}
                  value={form.msg}
                  onChange={(e) => setForm({ ...form, msg: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Describe your issue or query..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 py-3 text-sm font-bold text-white dark:text-slate-950 transition-colors"
              >
                Submit Ticket
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
