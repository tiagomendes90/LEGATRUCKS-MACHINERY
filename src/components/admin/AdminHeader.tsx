
import React from "react";
import { Button } from "@/components/ui/button";
import { Home, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdminHeaderProps {
  userEmail?: string;
  onGoHome: () => void;
  onSignOut: () => void;
}

const AdminHeader = ({ userEmail, onGoHome, onSignOut }: AdminHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-4xl font-bold text-slate-800 mb-2">{t('admin.title')}</h1>
        <p className="text-gray-600">{t('admin.welcome')}, {userEmail}</p>
      </div>
      <div className="space-x-2">
        <Button onClick={onGoHome} variant="outline">
          <Home className="h-4 w-4 mr-2" />
          {t('common.legarWebsite')}
        </Button>
        <Button onClick={onSignOut} variant="outline">
          <LogOut className="h-4 w-4 mr-2" />
          {t('admin.signOut')}
        </Button>
      </div>
    </div>
  );
};

export default AdminHeader;
