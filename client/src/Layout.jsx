import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import { useAuth } from './context/AuthContext';
import { LogOut } from 'lucide-react';
import NotificationBell from './components/NotificationBell';

const Layout = ({ children }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen bg-[#FDFBF7] text-foreground font-sans selection:bg-orange-500/30 relative">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay pointer-events-none fixed"></div>

            <div className="flex-1 flex flex-col min-w-0 z-10 relative">
                <Header />
                {/* Dark Sub-header strip with User Info */}
                <div className="bg-[#2C3E50] h-12 flex items-center justify-between px-8 shadow-inner">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#138808] animate-pulse"></div>
                        <span className="text-white font-medium text-sm tracking-wide uppercase">System Active</span>
                    </div>
                    {/* Re-added User Info here */}
                    <div className="flex items-center gap-6">
                        <span className="text-white/80 text-sm font-medium">Jai Hind, {user?.full_name || 'User'}</span>
                        <div className="h-4 w-px bg-white/20"></div>
                        <NotificationBell />
                        <div className="h-4 w-px bg-white/20"></div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 text-white/70 hover:text-red-400 transition-colors text-sm font-medium cursor-pointer"
                        >
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
                <main className="flex-1 p-8 overflow-auto bg-gradient-to-br from-[#FF9933]/40 via-white to-[#138808]/40">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
