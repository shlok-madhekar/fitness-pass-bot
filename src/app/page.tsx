import PassManager from "@/components/PassManager";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans flex flex-col items-center justify-center p-4">

      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">

        {/* Header */}
        <div className="mb-10 text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl mb-4">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
            24H Free Pass
          </h1>
          <p className="text-zinc-400 text-sm">
            Generate unlimited 3-day guest passes
          </p>
        </div>

        <PassManager />

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-zinc-600 flex flex-col gap-1">
          <p>For educational purposes only.</p>
          <p>Not affiliated with 24 Hour Fitness.</p>
        </div>
      </div>
    </main>
  );
}
