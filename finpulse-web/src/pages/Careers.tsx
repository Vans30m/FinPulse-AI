import { Briefcase, MapPin, Clock, Award } from "lucide-react";

export default function Careers() {
  const jobs = [
    { title: "Senior AI Research Scientist", team: "Research", loc: "Mumbai / Hybrid", type: "Full-Time" },
    { title: "Lead Frontend Engineer (React/TS)", team: "Product", loc: "Remote (India)", type: "Full-Time" },
    { title: "Infrastructure Security Engineer", team: "Security", loc: "Bengaluru / Office", type: "Full-Time" }
  ];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Join the Future of Algorithmic Intelligence
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Build low-latency pipelines, train specialized financial transformers, and help shape how sentiment is processed globally.
        </p>
      </div>

      {/* Perks / Benefits */}
      <div className="glass-panel p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <Award className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
          <h4 className="font-bold text-slate-900 dark:text-white">Modern Equipment</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Top-spec MacBooks/Workstations and generous home office setups to perform your best work.</p>
        </div>
        <div className="space-y-2">
          <Award className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
          <h4 className="font-bold text-slate-900 dark:text-white">Healthcare & Wellness</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Comprehensive health insurance coverage plans for you and your dependents, plus gym stipends.</p>
        </div>
        <div className="space-y-2">
          <Award className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
          <h4 className="font-bold text-slate-900 dark:text-white">Continuous Learning</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Stipends for developer conferences, research journals, online courses, and book purchases.</p>
        </div>
      </div>

      {/* Job Openings */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
          Open Roles
        </h2>
        <div className="space-y-4">
          {jobs.map((job, idx) => (
            <div
              key={idx}
              className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-slate-350 dark:hover:border-slate-800 transition-all"
            >
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                  {job.title}
                </h3>
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.loc}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {job.type}
                  </span>
                  <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-bold uppercase tracking-wider text-[10px]">
                    {job.team}
                  </span>
                </div>
              </div>
              <button className="rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950 transition-colors self-start md:self-auto">
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
