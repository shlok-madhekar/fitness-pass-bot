"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Calendar,
    Link as LinkIcon,
    RefreshCw,
    Lock,
    ChevronRight,
    LogOut,
    Ticket,
    CheckCircle2,
    AlertCircle
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
                    gymUrl: user.gymUrl || "https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport#freepass"
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
        if (window.confirm("Are you sure you want to reset your profile? All data will be cleared.")) {
            localStorage.clear();
            setUser(null);
            setPass(null);
            setFirstName("");
            setLastName("");
            setDateOfBirth("");
            setGymUrl("https://www.24hourfitness.com/gyms/san-ramon-ca/san-ramon-super-sport#freepass");
        }
    };

    const handleEditDetails = () => {
        setUser(null);
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
            <div className="w-full max-w-md">

                {/* Header Area */}
                <div className="mb-8 px-2">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">Fitness Pass</h1>
                    <p className="text-zinc-500 font-medium">Generate 3-day guest passes instantly.</p>
                </div>

                <AnimatePresence mode="wait">
                    {!user ? (
                        <motion.div
                            key="onboarding"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-3xl p-6 premium-shadow"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <User size={22} />
                                </div>
                                <h2 className="text-xl font-bold text-zinc-900">Setup Profile</h2>
                            </div>

                            <form onSubmit={handleSaveUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Jane"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-zinc-900 font-medium h-12"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Doe"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-zinc-900 font-medium h-12"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Date of Birth</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                        <input
                                            type="date"
                                            required
                                            value={dateOfBirth}
                                            onChange={(e) => setDateOfBirth(e.target.value)}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3 text-zinc-900 font-medium h-12"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Gym URL</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                        <input
                                            type="url"
                                            required
                                            value={gymUrl}
                                            onChange={(e) => setGymUrl(e.target.value)}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3 text-zinc-900 font-medium text-sm h-12"
                                            placeholder="https://www.24hourfitness.com/gyms/..."
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-2xl py-4 transition-all mt-6 shadow-lg shadow-blue-200"
                                >
                                    Continue
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {/* Pass Card */}
                            <div className="bg-white rounded-3xl p-8 premium-shadow transition-all relative overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 z-0" />

                                <div className="relative z-10 flex flex-col items-center py-4">
                                    <div className="p-3 bg-zinc-50 rounded-2xl mb-4">
                                        <Ticket className="text-zinc-400" size={32} />
                                    </div>

                                    <p className="text-zinc-400 font-bold text-xs uppercase tracking-[0.2em] mb-2">Your Entry Code</p>

                                    {isPassValid(pass) ? (
                                        <div className="flex flex-col items-center">
                                            <h2 className="text-5xl font-black text-blue-600 tracking-wider mb-2">{pass?.code}</h2>
                                            <div className="flex items-center gap-1.5 py-1.5 px-3 bg-green-50 text-green-600 rounded-full text-xs font-bold ring-1 ring-green-100">
                                                <CheckCircle2 size={14} />
                                                Active Pass Verified
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <h2 className="text-4xl font-black text-zinc-200 mb-2">XXXXXX</h2>
                                            <div className="flex items-center gap-1.5 py-1.5 px-3 bg-zinc-50 text-zinc-400 rounded-full text-xs font-bold">
                                                <AlertCircle size={14} />
                                                No active pass found
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Area */}
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => handleGeneratePass()}
                                    disabled={loading}
                                    className="w-full flex items-center justify-between bg-zinc-900 hover:bg-black text-white p-5 rounded-2xl transition-all disabled:opacity-50 group shadow-xl shadow-zinc-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-zinc-800 rounded-xl group-hover:bg-zinc-700 transition-colors">
                                            {loading ? <RefreshCw className="animate-spin text-zinc-400" size={20} /> : <RefreshCw className="text-white" size={20} />}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-base leading-tight">
                                                {isPassValid(pass) ? "Regenerate New Pass" : "Get Free Pass"}
                                            </p>
                                            <p className="text-xs text-zinc-500 font-medium">Takes less than 1 second</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-zinc-600" size={20} />
                                </button>

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ring-1 ring-red-100 animate-pulse">
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}
                            </div>

                            {/* Settings / Profile Section */}
                            <div className="bg-white rounded-2xl p-4 secondary-shadow divide-y divide-zinc-100 mt-6">
                                <div className="flex items-center justify-between pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                                            <User size={20} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-sm font-bold text-zinc-900 truncate">{user.firstName} {user.lastName}</p>
                                            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide truncate">
                                                {user.gymUrl?.split('/gyms/')[1]?.split('#')[0].replace(/-/g, ' ') || "Default Location"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleEditDetails}
                                        className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        Edit
                                    </button>
                                </div>

                                <button
                                    onClick={handleReset}
                                    className="w-full flex items-center gap-3 pt-3 text-red-500 hover:text-red-600 transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Reset App & Clear Data</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Secure Footer */}
                <div className="mt-8 flex items-center justify-center gap-2 opacity-30 select-none grayscale">
                    <Lock size={12} className="text-zinc-900" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">Direct Connection Active</span>
                </div>
            </div>
        </div>
    );
}
