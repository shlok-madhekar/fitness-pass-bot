"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Calendar,
    RefreshCw,
    Ticket,
    CheckCircle2,
    AlertCircle,
    Settings,
    LogOut,
    MapPin
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

    // Aggressively strip query params and existing fragments to get the clean path
    url = url.split('?')[0].split('#')[0].replace(/\/$/, '');

    // Re-apply #freepass for gym pages to ensure the form triggers correctly
    if (url.includes('/gyms/')) {
        url += '#freepass';
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
        // Removed window.confirm for immediate feedback as requested
        localStorage.clear();
        setUser(null);
        setPass(null);
        setFirstName("");
        setLastName("");
        setDateOfBirth("");
        setGymInput("");
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#fdfaf6] flex flex-col items-center">

            {/* Minimalist Top Bar */}
            <header className="w-full max-w-sm px-6 pt-12 pb-6 flex items-center justify-between">
                <span className="font-arido font-bold text-lg text-[#2c2420] tracking-tight">Arido</span>
            </header>

            <main className="w-full max-w-sm px-6 flex-1 flex flex-col pb-12">
                <AnimatePresence mode="wait">
                    {!user ? (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col justify-center"
                        >
                            <div className="mb-8">
                                <h1 className="text-xl font-arido font-bold text-[#2c2420] mb-1">Onboarding</h1>
                                <p className="text-xs font-medium text-[#8b5e3c] opacity-70">Complete your profile to continue</p>
                            </div>

                            <form onSubmit={handleSaveUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b5e3c] opacity-60 ml-px">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full h-11 bg-white border border-[#eaddd3] rounded-xl px-4 text-sm text-[#2c2420] font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b5e3c] opacity-60 ml-px">Last Name</label>
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
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b5e3c] opacity-60 ml-px">Date of Birth</label>
                                    <input
                                        type="date"
                                        required
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        className="w-full h-11 bg-white border border-[#eaddd3] rounded-xl px-4 text-sm text-[#2c2420] font-medium [color-scheme:light]"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b5e3c] opacity-60 ml-px">Gym URL</label>
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
                                    Login
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col pt-6"
                        >
                            {/* Simple Pass Card */}
                            <div className="bg-white rounded-2xl p-8 border border-[#eaddd3] secondary-shadow text-center relative mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b5e3c] opacity-40 mb-8 block">Member Access</span>

                                <div className="py-2">
                                    {isPassValid(pass) ? (
                                        <div className="space-y-4">
                                            <h2 className="text-5xl font-arido font-bold text-[#2c2420] tracking-tight">{pass?.code}</h2>
                                            <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-[#fdfaf6] text-[#d97706] rounded-full text-[9px] font-bold uppercase tracking-widest border border-[#eaddd3]">
                                                <CheckCircle2 size={10} />
                                                Active Pass
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <h2 className="text-4xl font-arido font-bold text-zinc-100 tracking-tight">WAITING</h2>
                                            <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-zinc-50 text-zinc-300 rounded-full text-[9px] font-bold uppercase tracking-widest border border-zinc-100">
                                                <AlertCircle size={10} />
                                                System Ready
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Main Action */}
                            <button
                                onClick={() => handleGeneratePass()}
                                disabled={loading}
                                className="w-full h-14 bg-[#2c2420] hover:bg-black text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 mb-4"
                            >
                                {loading ? (
                                    <RefreshCw className="animate-spin text-[#d97706]" size={18} />
                                ) : (
                                    <Ticket size={18} className="text-[#d97706]" />
                                )}
                                <span className="font-bold text-sm tracking-wide">
                                    {loading ? "Processing..." : isPassValid(pass) ? "Refresh Code" : "Request Free Pass"}
                                </span>
                            </button>

                            {error && (
                                <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-[10px] font-bold uppercase tracking-wide text-center border border-red-100">
                                    {error}
                                </div>
                            )}

                            {/* Profile Bar */}
                            <div className="bg-white rounded-xl p-3 border border-[#eaddd3] flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-3 pl-1">
                                    <div className="w-8 h-8 rounded-full bg-[#fdfaf6] border border-[#eaddd3] flex items-center justify-center text-[#d97706]">
                                        <User size={14} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-[11px] font-bold text-[#2c2420] uppercase tracking-tight truncate">{user.firstName} {user.lastName}</p>
                                        <div className="flex items-center gap-1 text-[9px] font-medium text-[#8b5e3c] opacity-50">
                                            <MapPin size={8} />
                                            <span className="truncate max-w-[120px]">
                                                {user.gymUrl?.split('/gyms/')[1]?.split('#')[0].replace(/-/g, ' ') || "Gym"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    <button
                                        onClick={() => setUser(null)}
                                        className="p-2 text-[#2c2420] hover:bg-[#fdfaf6] rounded-lg transition-all"
                                        title="Settings"
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
        </div>
    );
}
