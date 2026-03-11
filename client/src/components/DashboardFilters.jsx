import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Filter, Clock, ChevronDown, Check } from 'lucide-react';

export default function DashboardFilters({ priorityFilter, setPriorityFilter, sortOrder, setSortOrder, themeColor = 'slate' }) {
    // Dynamic theme classes
    const themeClasses = {
        slate: {
            text: 'text-slate-600',
            border: 'focus:border-slate-300 focus:ring-slate-400/40',
            bgActive: 'bg-slate-50/50',
            textHover: 'hover:text-slate-700',
            check: 'text-slate-600'
        },
        orange: {
            text: 'text-orange-500',
            border: 'focus:border-orange-300 focus:ring-orange-400/40',
            bgActive: 'bg-orange-50/50',
            textHover: 'hover:text-orange-600',
            check: 'text-orange-500'
        },
        yellow: {
            text: 'text-yellow-600',
            border: 'focus:border-yellow-300 focus:ring-yellow-400/40',
            bgActive: 'bg-yellow-50/50',
            textHover: 'hover:text-yellow-700',
            check: 'text-yellow-600'
        },
        green: {
            text: 'text-green-600',
            border: 'focus:border-green-300 focus:ring-green-400/40',
            bgActive: 'bg-green-50/50',
            textHover: 'hover:text-green-700',
            check: 'text-green-600'
        }
    };

    const currentTheme = themeClasses[themeColor] || themeClasses.slate;

    return (
        <div className="flex items-center gap-2">
            {/* Priority Dropdown */}
            <div className="relative z-20">
                <Menu as="div" className="relative inline-block text-left w-[130px]">
                    <Menu.Button className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm text-xs font-semibold text-slate-700 hover:bg-white/80 focus:outline-none focus:ring-2 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] transition-all ${currentTheme.border}`}>
                        <span className="flex items-center gap-1.5 truncate">
                            <Filter className={`w-3.5 h-3.5 flex-shrink-0 ${currentTheme.text}`} />
                            <span className="truncate">{priorityFilter === 'ALL' ? 'All Priorities' : priorityFilter.charAt(0) + priorityFilter.slice(1).toLowerCase()}</span>
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
                    </Menu.Button>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 mt-1.5 w-40 origin-top-right rounded-xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-lg ring-1 ring-black/5 focus:outline-none overflow-hidden pb-1 z-50">
                            <div className="py-1">
                                {[
                                    { id: 'ALL', label: 'All Priorities' },
                                    { id: 'CRITICAL', label: 'Critical', color: 'text-red-500', bg: 'bg-red-50' },
                                    { id: 'HIGH', label: 'High', color: 'text-orange-500', bg: 'bg-orange-50' },
                                    { id: 'MEDIUM', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                                    { id: 'LOW', label: 'Low', color: 'text-blue-500', bg: 'bg-blue-50' }
                                ].map((opt) => (
                                    <Menu.Item key={opt.id}>
                                        {({ active }) => (
                                            <button
                                                onClick={() => setPriorityFilter(opt.id)}
                                                className={`${active || priorityFilter === opt.id ? currentTheme.bgActive : ''
                                                    } flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 ${currentTheme.textHover} transition-colors ${priorityFilter === opt.id ? 'font-bold' : 'font-medium'}`}
                                            >
                                                {opt.id !== 'ALL' && (
                                                    <span className={`w-1.5 h-1.5 rounded-full ${opt.bg.replace('bg-', 'bg-').replace('-50', '-500')}`} />
                                                )}
                                                <span className="flex-1 text-left">{opt.label}</span>
                                                {priorityFilter === opt.id && <Check className={`w-3.5 h-3.5 ${currentTheme.check}`} />}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>

            {/* Sort Dropdown */}
            <div className="relative z-10">
                <Menu as="div" className="relative inline-block text-left w-[115px]">
                    <Menu.Button className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm text-xs font-semibold text-slate-700 hover:bg-white/80 focus:outline-none focus:ring-2 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] transition-all ${currentTheme.border}`}>
                        <span className="flex items-center gap-1.5 truncate">
                            <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{sortOrder === 'NEWEST' ? 'Newest First' : 'Oldest First'}</span>
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
                    </Menu.Button>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 mt-1.5 w-36 origin-top-right rounded-xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-lg ring-1 ring-black/5 focus:outline-none overflow-hidden pb-1 z-50">
                            <div className="py-1">
                                {[
                                    { id: 'NEWEST', label: 'Newest First' },
                                    { id: 'OLDEST', label: 'Oldest First' }
                                ].map((opt) => (
                                    <Menu.Item key={opt.id}>
                                        {({ active }) => (
                                            <button
                                                onClick={() => setSortOrder(opt.id)}
                                                className={`${active || sortOrder === opt.id ? 'bg-slate-50' : ''
                                                    } flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 transition-colors ${sortOrder === opt.id ? 'font-bold' : 'font-medium'}`}
                                            >
                                                <span className="flex-1 text-left">{opt.label}</span>
                                                {sortOrder === opt.id && <Check className="w-3.5 h-3.5 text-slate-500" />}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>
        </div>
    );
}
