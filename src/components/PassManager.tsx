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
    MapPin,
    Settings
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

/**
 * Normalizes a URL-like string into a full 24 Hour Fitness pass URL.
 * Handles missing protocol, missing www, and missing #freepass.
 */
function normalizeGymUrl(input: string): string {
    let url = input.trim();
    if (!url) return DEFAULT_GYM_URL;

    // Add https:// if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    // Ensure it's a 24hourfitness.com link
    if (!url.includes('24hourfitness.com')) {
        return url; // Don't mess with it if it's not the right domain, let API handle error
    }

    // Ensure #freepass fragment is present if it's a gym page
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

    // Form State
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
        if (savedPass) {
            setPass(savedPass);
        }
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
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...user,
                    gymUrl: user.gymUrl || DEFAULT_GYM_URL
                }),
            });

            const data = await res.json();
            if (data.success) {
                const newPass: PassData = {
                    code: data.code,
                    generatedAt: Date.now(),
                };
                savePassData(newPass);
                setPass(newPass);
            } else {
                setError(data.error || "Failed to generate pass");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (window.confirm("Delete all data? This cannot be undone.")) {
            localStorage.clear();
            setUser(null);
            setPass(null);
            setFirstName("");
            setLastName("");
            setDateOfBirth("");
            setGymInput("");
        }
    };

    const handleEditDetails = () => {
        setUser(null);
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#fdfaf6] flex flex-col items-center p-6 font-sans">
            <div className="w-full max-w-md pt-12">

                {/* Branding */}
                <div className="mb-12 text-center">
                    <h1 className="text-5xl font-arido font-bold text-[#2c2420] tracking-tight mb-2">Arido</h1>
                    <div className="h-0.5 w-12 bg-[#d97706] mx-auto mb-4" />
                    <p className="text-[#8b5e3c] font-medium text-sm tracking-wide uppercase">Simple Fitness Access</p>
                </div>

                <AnimatePresence mode="wait">
                    {!user ? (
                        <motion.div
                            key="onboarding"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white rounded-[32px] p-8 border border-[#eaddd3] premium-shadow"
                        >
                            <h2 className="text-2xl font-arido font-bold text-[#2c2420] mb-8 text-center">Welcome</h2>

                            <form onSubmit={handleSaveUser} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8b5e3c] ml-1">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Jane"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full h-14 rounded-2xl px-5 text-[#2c2420] font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#8b5e3c] ml-1">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Doe"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full h-14 rounded-2xl px-5 text-[#2c2420] font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8b5e3c] ml-1">Birth Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8b5e3c] opacity-50" size={18} />
                                        <input
                                            type="date"
                                            required
                                            value={dateOfBirth}
                                            onChange={(e) => setDateOfBirth(e.target.value)}
                                            className="w-full h-14 rounded-2xl pl-14 pr-5 text-[#2c2420] font-medium [color-scheme:light]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#8b5e3c] ml-1">Gym Location (URL or Name)</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8b5e3c] opacity-50" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={gymInput}
                                            onChange={(e) => setGymInput(e.target.value)}
                                            className="w-full h-14 rounded-2xl pl-14 pr-5 text-[#2c2420] font-medium text-sm"
                                            placeholder="24hourfitness.com/gyms/..."
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[#d97706] hover:bg-[#b45309] active:scale-[0.98] text-white font-bold rounded-2xl h-16 transition-all mt-4 tracking-wide shadow-lg shadow-orange-100"
                                >
                                    Get Started
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-4"
                        >
                            {/* Pass Card */}
                            <div className="bg-white rounded-[40px] p-10 border border-[#eaddd3] premium-shadow text-center relative overflow-hidden">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8b5e3c] mb-6 opacity-60">Guest Entry Code</p>

                                <div className="py-6">
                                    {isPassValid(pass) ? (
                                        <div className="space-y-4">
                                            <h2 className="text-6xl font-arido font-bold text-[#2c2420] tracking-tighter">{pass?.code}</h2>
                                            <div className="inline-flex items-center gap-2 py-2 px-4 bg-[#fdfaf6] text-[#d97706] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#eaddd3]">
                                                <CheckCircle2 size={12} />
                                                Verified Active
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <h2 className="text-5xl font-arido font-bold text-zinc-100 tracking-tighter">REFRESH</h2>
                                            <div className="inline-flex items-center gap-2 py-2 px-4 bg-zinc-50 text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-100">
                                                <AlertCircle size={12} />
                                                Ready to Generate
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Main Action */}
                            <button
                                onClick={() => handleGeneratePass()}
                                disabled={loading}
                                className="w-full bg-[#2c2420] hover:bg-black text-white h-20 rounded-[28px] transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl shadow-zinc-200"
                            >
                                {loading ? (
                                    <RefreshCw className="animate-spin text-[#d97706]" size={24} />
                                ) : (
                                    <Ticket size={24} className="text-[#d97706]" />
                                )}
                                <span className="font-arido font-bold text-lg tracking-wide">
                                    {loading ? "Generating..." : isPassValid(pass) ? "Refresh New Pass" : "Claim Free Pass"}
                                </span>
                            </button>

                            {error && (
                                <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center border border-red-100 animate-pulse">
                                    {error}
                                </div>
                            )}

                            {/* Profile Bar */}
                            <div className="bg-white rounded-[24px] p-2 border border-[#eaddd3] flex items-center justify-between mt-8">
                                <div className="flex items-center gap-3 pl-2">
                                    <div className="w-10 h-10 rounded-full bg-[#fdfaf6] border border-[#eaddd3] flex items-center justify-center text-[#d97706]">
                                        <User size={18} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-[12px] font-black text-[#2c2420] uppercase tracking-tight truncate">{user.firstName} {user.lastName}</p>
                                        <p className="text-[10px] font-bold text-[#8b5e3c] opacity-60 truncate">
                                            {user.gymUrl?.split('/gyms/')[1]?.split('#')[0].replace(/-/g, ' ') || "Default Gym"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center pr-1">
                                    <button
                                        onClick={handleEditDetails}
                                        className="p-3 text-[#2c2420] hover:text-[#d97706] transition-colors"
                                        title="Edit Profile"
                                    >
                                        <Settings size={20} />
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="p-3 text-[#8b5e3c] hover:text-red-600 transition-colors"
                                        title="Reset All"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
