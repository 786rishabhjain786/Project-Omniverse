"use client";

import React, { useState, useEffect } from "react";

interface Job {
  id: string;
  title: string;
  media_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function OmniverseDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState("video/mp4");
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        if (!selectedJob && data.length > 0) {
          setSelectedJob(data[0].id);
        }
      }
    } catch (e) {
      console.error("Gateway polling error", e);
    }
  };

  useEffect(() => {
    fetchJobs();
    const timer = setInterval(fetchJobs, 2000);
    return () => clearInterval(timer);
  }, [selectedJob]);

  const handleEnqueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, mediaType }),
      });
      if (res.ok) {
        const payload = await res.json();
        setTitle("");
        setSelectedJob(payload.jobId);
        await fetchJobs();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Project Omniverse
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Distributed Polyglot Media Engine • PostgreSQL • MongoDB • Redis • .NET 8 • FastAPI
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 text-xs font-mono bg-slate-800 border border-slate-700 rounded-md text-emerald-400">
              Redis: :6379
            </span>
            <span className="px-3 py-1 text-xs font-mono bg-slate-800 border border-slate-700 rounded-md text-sky-400">
              Gateway: :5000
            </span>
            <span className="px-3 py-1 text-xs font-mono bg-slate-800 border border-slate-700 rounded-md text-purple-400">
              AI: :8000
            </span>
          </div>
        </header>

        {/* Dispatch Form */}
        <section className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Enqueue Media Pipeline Job</h2>
          <form onSubmit={handleEnqueue} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="e.g. quantum_computing_lecture.mp4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-300 font-mono"
            >
              <option value="video/mp4">video/mp4</option>
              <option value="audio/wav">audio/wav</option>
              <option value="video/mkv">video/mkv</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium rounded-xl text-sm transition"
            >
              {loading ? "Enqueuing..." : "Dispatch Job"}
            </button>
          </form>
        </section>

        {/* Live Relational Jobs Feed */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h2 className="font-semibold text-slate-200">Relational Pipeline Queue (PostgreSQL)</h2>
            <span className="text-xs text-slate-400 font-mono">Live Poll: 2000ms</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-950/40 text-xs font-mono text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Job ID</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Media Type</th>
                  <th className="p-4">State</th>
                  <th className="p-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {jobs.map((j) => (
                  <tr
                    key={j.id}
                    onClick={() => setSelectedJob(j.id)}
                    className={`cursor-pointer transition ${
                      selectedJob === j.id ? "bg-indigo-950/30" : "hover:bg-slate-800/30"
                    }`}
                  >
                    <td className="p-4 text-indigo-400 font-semibold">{j.id.slice(0, 8)}...</td>
                    <td className="p-4 text-slate-200">{j.title}</td>
                    <td className="p-4 text-slate-400">{j.media_type}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          j.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{new Date(j.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                      No jobs recorded. Submit a job above to trigger the pipeline.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}