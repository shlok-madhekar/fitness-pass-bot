"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Calendar,
    Link as LinkIcon,
    RefreshCw,
    ChevronRight,
    LogOut,
    Ticket,
    CheckCircle2,
    AlertCircle,
    Settings,
    Shield
} from "lucide-react";
import {
    saveUserData,
    getUserData,
    savePassData,
    getPassData,
    isPassValid,
    UserData,
    PassData
} from "@/lib/storage";

const DEFAULT_GYM_URL = "https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport#freepass";

function normalizeGymUrl(input: string): string {
    let url = input.trim();
    if (!url) return DEFAULT_GYM_URL;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    if (!url.includes('24hourfitness.com')) return url;
    if (url.includes('/gyms/') && !url.includes('#')) {
        url = url.split('?')[0].split('#')[0].replace(/\/$/, '') + '#freepass';
    }
    return url;
}

export default function PassManager() {
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<UserData | null>(null);
    const [pass, setPass] = useState<PassData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [gymInput, setGymInput] = useState("");

    useEffect(() => {
        setMounted(true);
        const savedUser = getUserData();
        const savedPass = getPassData();
        if (savedUser) {
            setUser(savedUser);
            setFirstName(savedUser.firstName);
            setLastName(savedUser.lastName);
            setDateOfBirth(savedUser.dateOfBirth);
            setGymInput(savedUser.gymUrl || DEFAULT_GYM_URL);
        }
        if (savedPass) setPass(savedPass);
    }, []);

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName || !lastName || !dateOfBirth) return;
        const normalizedUrl = normalizeGymUrl(gymInput || DEFAULT_GYM_URL);
        const newData = { firstName, lastName, dateOfBirth, gymUrl: normalizedUrl };
        saveUserData(newData);
        setUser(newData);
    };

    const handleGeneratePass = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/generate-pass", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...user, gymUrl: user.gymUrl || DEFAULT_GYM_URL }),
            });
            const data = await res.json();
            if (data.success) {
                const newPass: PassData = { code: data.code, generatedAt: Date.now() };
                savePassData(newPass);
                setPass(newPass);
            } else {
                setError(data.error || "Generation failed.");
            }
        } catch (err) {
            setError("Connection failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (window.confirm("Clear all app data?")) {
            localStorage.clear();
            setUser(null);
            setPass(null);
            setFirstName("");
            setLastName("");
            setDateOfBirth("");
            setGymInput("");
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#fdfaf6] selection:bg-orange-100 flex flex-col items-center">

            {/* Top Bar Branding */}
            <header className="w-full max-w-sm px-6 pt-8 pb-4 flex items-center justify-between">
                <span className="font-arido font-bold text-xl text-[#2c2420] tracking-tight">Arido</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d97706]">BETA</span>
            </header>

            <main className="w-full max-w-sm px-6 flex-1 flex flex-col">
                <AnimatePresence mode="wait">
                    {!user ? (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex-1 flex flex-col justify-center"
                        >
                            <div className="mb-6">
                                <h1 className="text-2xl font-arido font-bold text-[#2c2420] mb-1">Getting Started</h1>
                                <p className="text-xs font-medium text-[#8b5e3c]">Fill in your gym details below</p>
                            </div>

                            <form onSubmit={handleSaveUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-[#8b5e3c] opacity-60">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full h-11 bg-white border border-[#eaddd3] rounded-xl px-4 text-sm text-[#2c2420] font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-wider text-[#8b5e3c] opacity-60">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full h-11 bg-white border border-[#eaddd3] rounded-xl px-4 text-sm text-[#2c2420] font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-[#8b5e3c] opacity-60">Date of Birth</label>
                                    <input
                                        type="date"
                                        required
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        className="w-full h-11 bg-white border border-[#eaddd3] rounded-xl px-4 text-sm text-[#2c2420] font-medium [color-scheme:light]"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-[#8b5e3c] opacity-60">Gym URL</label>
                                    <input
                                        type="text"
                                        required
                                        value={gymInput}
                                        onChange={(e) => setGymInput(e.target.value)}
                                        className="w-full h-11 bg-white border border-[#eaddd3] rounded-xl px-4 text-sm text-[#2c2420] font-medium tracking-tight"
                                        placeholder="24hourfitness.com/gyms/..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[#d97706] hover:bg-[#b45309] active:scale-[0.98] text-white font-bold rounded-xl h-12 transition-all mt-6 text-sm tracking-wide"
                                >
                                    Continue
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex-1 flex flex-col py-8"
                        >
                            {/* Pass Card */}
                            <div className="bg-white rounded-[32px] p-8 border border-[#eaddd3] premium-shadow text-center relative mb-6">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8b5e3c] opacity-40 mb-6 block">Pass Redemption Code</span>

                                <div className="py-4">
                                    {isPassValid(pass) ? (
                                        <div className="space-y-3">
                                            <h2 className="text-5xl font-arido font-bold text-[#2c2420] tracking-tighter">{pass?.code}</h2>
                                            <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-[#fdfaf6] text-[#d97706] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#eaddd3]">
                                                <CheckCircle2 size={10} />
                                                Verified Active
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <h2 className="text-4xl font-arido font-bold text-zinc-100 tracking-tighter">REFRESH</h2>
                                            <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-zinc-50 text-zinc-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-zinc-100">
                                                <AlertCircle size={10} />
                                                Ready to Link
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Main Generating Action */}
                            <button
                                onClick={() => handleGeneratePass()}
                                disabled={loading}
                                className="w-full h-16 bg-[#2c2420] hover:bg-black text-white rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 mb-4 shadow-xl shadow-zinc-100"
                            >
                                {loading ? (
                                    <RefreshCw className="animate-spin text-[#d97706]" size={20} />
                                ) : (
                                    <Ticket size={20} className="text-[#d97706]" />
                                )}
                                <span className="font-arido font-bold text-base tracking-wide">
                                    {loading ? "Syncing..." : isPassValid(pass) ? "Refresh Code" : "Acquire Free Pass"}
                                </span>
                            </button>

                            {error && (
                                <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-[10px] font-bold uppercase tracking-wide text-center border border-red-100">
                                    {error}
                                </div>
                            )}

                            {/* Info Section */}
                            <div className="bg-white rounded-2xl p-4 border border-[#eaddd3] flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#fdfaf6] border border-[#eaddd3] flex items-center justify-center text-[#d97706]">
                                        <User size={16} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-[11px] font-black text-[#2c2420] uppercase tracking-tight truncate">{user.firstName} {user.lastName}</p>
                                        <p className="text-[9px] font-bold text-[#8b5e3c] opacity-50 truncate max-w-[140px]">
                                            {user.gymUrl?.split('/gyms/')[1]?.split('#')[0].replace(/-/g, ' ') || "Gym Location"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setUser(null)}
                                        className="p-2 text-[#2c2420] hover:bg-[#fdfaf6] rounded-lg transition-all"
                                        title="Profile"
                                    >
                                        <Settings size={18} />
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="p-2 text-[#8b5e3c] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Reset"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Subdued Legal Footer */}
            <footer className="w-full max-w-sm px-6 py-8 text-center space-y-4">
                <div className="flex items-center justify-center gap-1.5 opacity-20 grayscale scale-90">
                    <Shield size={10} className="text-zinc-900" />
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-900">End-to-End Encrypted</span>
                </div>

                <div className="text-[9px] font-bold text-[#8b5e3c] uppercase tracking-widest opacity-20 leading-relaxed max-w-[200px] mx-auto">
                    Educational utility. Independent of 24 Hour Fitness.
                </div>
            </footer>
        </div>
    );
}
