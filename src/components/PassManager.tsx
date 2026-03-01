"use client";

import { useState, useEffect } from "react";
import { UserData, PassData, getUserData, getPassData, isPassValid, saveUserData, savePassData } from "@/lib/storage";
import { Loader2, RefreshCw, CheckCircle } from "lucide-react";

export default function PassManager() {
    const [user, setUser] = useState<UserData | null>(null);
    const [pass, setPass] = useState<PassData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Form states
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [gymUrl, setGymUrl] = useState("https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport#freepass");

    useEffect(() => {
        setMounted(true);
        const savedUser = getUserData();
        const savedPass = getPassData();
        if (savedUser) {
            setUser(savedUser);
            setFirstName(savedUser.firstName);
            setLastName(savedUser.lastName);
            setDateOfBirth(savedUser.dateOfBirth);
            setGymUrl(savedUser.gymUrl || "https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport#freepass");
        }
        if (savedPass) {
            setPass(savedPass);
        }
    }, []);

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName || !lastName || !dateOfBirth || !gymUrl) return;
        const newData = { firstName, lastName, dateOfBirth, gymUrl };
        saveUserData(newData);
        setUser(newData);
    };

    const handleGeneratePass = async (isRegenerate: boolean = false) => {
        if (!user) return;

        // Allow regeneration without confirmation


        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/generate-pass", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...user,
                    gymUrl: user.gymUrl || "https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport#freepass"
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate pass");
            }

            if (data.success && data.code) {
                const newPass: PassData = {
                    code: data.code,
                    generatedAt: Date.now()
                };
                savePassData(newPass);
                setPass(newPass);
            } else {
                throw new Error("Invalid response from server");
            }

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleEditDetails = () => {
        setUser(null);
    };

    if (!mounted) return null; // Prevent hydration errors

    if (!user) {
        return (
            <div className="w-full max-w-md mx-auto p-6 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-xl">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Setup Profile</h2>
                    <p className="text-zinc-400 text-sm">Enter your details exactly as they should appear on your pass.</p>
                </div>

                <form onSubmit={handleSaveUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">First Name</label>
                        <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            placeholder="John"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Last Name</label>
                        <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            placeholder="Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Date of Birth</label>
                        <input
                            type="date"
                            required
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all font-medium [color-scheme:dark]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Gym URL (#freepass)</label>
                        <input
                            type="url"
                            required
                            value={gymUrl}
                            onChange={(e) => setGymUrl(e.target.value)}
                            className="w-full bg-zinc-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            placeholder="https://www.24hourfitness.com/gyms/..."
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3.5 transition-colors mt-4"
                    >
                        Save Details
                    </button>
                </form>
            </div>
        );
    }

    const valid = isPassValid(pass);

    return (
        <div className="w-full max-w-md mx-auto space-y-6">

            {/* Code Display Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />

                <div className="relative z-10">
                    <p className="text-zinc-400 font-medium mb-2 uppercase tracking-widest text-xs">Your Entry Code</p>

                    {pass && valid ? (
                        <div className="py-4">
                            <div className="text-6xl font-black text-white tracking-wider font-mono drop-shadow-md">
                                {pass.code}
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-4 text-emerald-400 text-sm font-medium">
                                <CheckCircle size={16} /> Valid Check-In Code
                            </div>
                        </div>
                    ) : (
                        <div className="py-8">
                            <div className="text-5xl font-black text-zinc-700 tracking-wider font-mono">
                                ------
                            </div>
                            <p className="mt-4 text-zinc-500 text-sm">
                                {pass && !valid ? "Your previous pass has expired." : "No active pass found."}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
                <button
                    onClick={() => handleGeneratePass(!valid ? false : true)}
                    disabled={loading}
                    className={`w-full font-semibold rounded-xl py-4 flex items-center justify-center gap-2 transition-all ${loading
                        ? "bg-blue-600/50 cursor-not-allowed text-white/70"
                        : valid
                            ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Generating Pass...
                        </>
                    ) : valid ? (
                        <>
                            <RefreshCw size={18} /> Regenerate Pass
                        </>
                    ) : (
                        "Generate New Pass"
                    )}
                </button>

                <div className="flex items-center justify-between px-2 pt-4">
                    <div className="text-sm text-zinc-500 flex flex-col overflow-hidden">
                        <span className="font-medium text-zinc-300">Profile Logged In</span>
                        <div className="truncate">
                            {user.firstName} {user.lastName} • {user.dateOfBirth}
                        </div>
                        <div className="text-[10px] truncate max-w-[180px] opacity-70">
                            {user.gymUrl?.split('/gyms/')[1]?.split('#')[0] || user.gymUrl || "San Ramon Super-Sport"}
                        </div>
                    </div>
                    <button
                        onClick={handleEditDetails}
                        className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                    >
                        Edit Profile
                    </button>
                </div>
            </div>
        </div>
    );
}
