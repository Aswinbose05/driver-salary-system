import React, { useState } from 'react';
import {
  Car,
  Shield,
  Sun,
  Moon,
  LogOut,
  KeyRound,
  LogIn,
  ChevronDown,
  User,
  Users,
  Calendar,
  FileText,
  History,
  Settings,
  Menu,
  X,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { LoginModal } from '../auth/LoginModal';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { currentUser, role, isAdmin, logout, switchUser, availableProfiles } = useAuth();
  const { theme, toggleTheme, rates } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

  // Tab definitions based on role
  const driverTabs = [
    { id: 'dashboard', label: 'My Dashboard & Log', icon: Car },
    { id: 'reports', label: 'Monthly Earnings & Payslip', icon: FileText },
  ];

  const adminTabs = [
    { id: 'dashboard', label: 'Fleet Overview', icon: Users },
    { id: 'reports', label: 'Monthly Reports & Payslips', icon: FileText },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'settings', label: 'Rates & Settings', icon: Settings },
  ];

  const tabs = isAdmin ? adminTabs : driverTabs;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                    FleetPay
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    INR • IST
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {rates.system_name}
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`touch-target px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Controls: Role Switcher, Theme Toggle, Profile */}
            <div className="flex items-center gap-2">
              {/* Role Fast Switcher */}
              <div className="relative">
                <select
                  value={currentUser?.id || ''}
                  onChange={(e) => switchUser(e.target.value)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  title="Switch between Admin and Driver accounts"
                >
                  <optgroup label="Administrator">
                    {availableProfiles
                      .filter((p) => p.role === 'admin')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          👑 {p.full_name} (Admin)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Fleet Drivers">
                    {availableProfiles
                      .filter((p) => p.role === 'driver')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          🚗 {p.full_name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle light or dark theme"
                className="touch-target p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>

              {/* Profile / Account Dropdown */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="touch-target flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                      isAdmin ? 'bg-indigo-600' : 'bg-emerald-600'
                    }`}>
                      {currentUser.full_name.charAt(0)}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 text-xs">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <span className="font-extrabold text-slate-900 dark:text-white block">
                          {currentUser.full_name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {currentUser.email}
                        </span>
                        <span className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          isAdmin
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {role.toUpperCase()}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowPasswordModal(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-2"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Change Password</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-2 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="touch-target px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile menu trigger */}
              <button
                type="button"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="touch-target md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Toggle navigation menu"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full py-3 px-3.5 rounded-xl text-left font-bold text-sm flex items-center gap-3 transition-all ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Modals */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </>
  );
};
