import React from "react";
import { PartnerDashboard } from "./Partner/PartnerDashboard";

interface SangjoDashboardProps {
    sangjoId: string;
    onBack: () => void;
}

export const SangjoDashboard: React.FC<SangjoDashboardProps> = ({ sangjoId, onBack }) => {
    return (
        <div className="fixed inset-0 z-[500] bg-white">
            <PartnerDashboard partnerId={sangjoId} onLogout={onBack} />
        </div>
    );
};
