import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Globe } from 'lucide-react';
import logo from '../assets/images/logo.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError('Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-[#FF9933] via-white to-[#138808] relative overflow-hidden font-sans text-foreground">
            {/* Background Overlays (Global) */}
            <div className="absolute inset-0 bg-white/10 mix-blend-overlay z-0"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay z-0"></div>

            {/* Blend Gradient (Optional, keeping from original left side if needed, or removing for cleaner look. Let's keep a subtle one if originally intended for text readability, but maybe globally it's not needed. I will remove the specific right-side blend to be safe, or keep it subtle.) */}

            {/* Left Side - Visuals */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10"
            >
                {/* Chakra Animation - Kept on Left */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-10 pointer-events-none"
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/17/Ashoka_Chakra.svg" alt="Chakra" className="w-full h-full invert-0 opacity-20" />
                </motion.div>

                <div>
                    <div className="w-16 h-16 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/50 shadow-lg">
                        <Globe className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight drop-shadow-sm">
                        Powering <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-slate-800 to-green-700">Public Service</span>
                    </h1>
                    <p className="text-slate-800 text-lg max-w-md font-medium">
                        Advanced ticket management system for efficient governance and team collaboration.
                    </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                    <div className="h-px w-8 bg-slate-400"></div>
                    © 2026 MOD-I Governance Platform
                </div>
            </motion.div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-lg space-y-8 bg-white/30 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-white/50"
                >
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="p-3 bg-white/40 rounded-full backdrop-blur-md shadow-lg border border-white/50">
                                <img src={logo} alt="Logo" className="w-20 h-20 object-contain drop-shadow-md" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Secure access to your dashboard
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-md text-sm text-center font-medium"
                            >
                                {error}
                            </motion.div>
                        )}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-500 group-focus-within:text-orange-600 transition-colors" />
                                    <Input
                                        type="email"
                                        required
                                        className="pl-10 bg-white/50 border-white/60 text-slate-900 focus:bg-white/80 focus:border-orange-500 focus:ring-orange-500 placeholder:text-slate-400"
                                        placeholder="officer@gov.in"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500 group-focus-within:text-green-600 transition-colors" />
                                    <Input
                                        type="password"
                                        required
                                        className="pl-10 bg-white/50 border-white/60 text-slate-900 focus:bg-white/80 focus:border-green-600 focus:ring-green-600 placeholder:text-slate-400"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-r from-[#FF9933] to-[#FF671F] hover:from-[#FF671F] hover:to-[#e64a19] text-white font-bold tracking-wide shadow-lg shadow-orange-500/20 border-none transition-all duration-300 hover:shadow-orange-500/40"
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
