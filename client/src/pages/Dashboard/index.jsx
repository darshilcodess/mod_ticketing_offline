import React from 'react';
import { useAuth } from '../../context/AuthContext';
import UnitDashboard from './UnitDashboard';
import G1Dashboard from './G1Dashboard';
import TeamDashboard from './TeamDashboard';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const { user } = useAuth();

    const renderDashboard = () => {
        switch (user?.role) {
            case 'UNIT': return <UnitDashboard />;
            case 'G1': return <G1Dashboard />;
            case 'TEAM': return <TeamDashboard />;
            default: return <div className="text-red-500">Unknown Role</div>;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >


            {renderDashboard()}
        </motion.div>
    );
}
