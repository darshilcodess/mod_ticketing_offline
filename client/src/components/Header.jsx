import React from 'react';
import logo from '../assets/images/logo.png';

const Header = () => {
    return (
        <header className="h-20 px-8 flex items-center justify-between bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shadow-md sticky top-0 z-50 relative overflow-hidden">
            {/* Left Logo */}
            <div className="z-10 bg-white/20 p-1 rounded-full backdrop-blur-sm shadow-sm">
                <img
                    src={logo}
                    alt="Indian Army Logo"
                    className="h-14 w-auto drop-shadow-lg"
                />
            </div>

            {/* Centered Title */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 drop-shadow-sm tracking-wide uppercase" style={{ fontFamily: 'Arial Black, sans-serif' }}>
                    MOD TICKETING SYSTEM
                </h1>
            </div>

            {/* Right Logo */}
            <div className="z-10 bg-white/20 p-1 rounded-full backdrop-blur-sm shadow-sm">
                <img
                    src={logo}
                    alt="Indian Army Logo"
                    className="h-14 w-auto drop-shadow-lg"
                />
            </div>
        </header>
    );
};

export default Header;
