import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { cn } from '../lib/utils';

export default function MainLayout() {
  const { settings } = useAppContext();
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen pb-44 selection:bg-secondary-fixed">
      {/* TopAppBar Component */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant shadow-sm flex justify-between items-center w-full px-screen-margin-mobile py-space-xs h-16">
        <div className="flex items-center gap-space-sm">
          <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary active:scale-95 transition-transform duration-150">
            <span className="material-symbols-outlined text-primary">storefront</span>
          </div>
          <div>
            <div className="flex items-center gap-space-2xs">
              <h1 className="text-headline-lg font-headline-lg text-primary tracking-tight truncate max-w-[150px]">
                {settings.shopName}
              </h1>
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
            </div>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Counter #1 • Online</p>
          </div>
        </div>
        {/* Right utility icons & sync */}
        <div className="flex items-center gap-space-xs">
          <button className="flex items-center gap-1 bg-surface-container-low px-space-sm py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-low active:scale-95 transition-transform duration-150">
            <span className="material-symbols-outlined text-primary text-sm">sync</span>
            <span className="text-label-sm font-label-sm text-primary">Synced</span>
          </button>
          <button
            aria-label="Settings"
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="pt-2">
        <Outlet />
      </div>

      {/* BottomNavBar Component */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-screen-margin-mobile bg-surface-container-lowest border-t border-outline-variant shadow-md">
        <NavLink to="/billing" className={({ isActive }) => cn(
          "flex flex-col items-center justify-center min-h-[48px] px-space-xs active:scale-95 transition-transform duration-100",
          isActive ? "text-secondary font-bold" : "text-on-surface-variant hover:bg-surface-container-low"
        )}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>point_of_sale</span>
          <span className="text-label-sm font-label-sm mt-0.5">Billing</span>
        </NavLink>

        <NavLink to="/products" className={({ isActive }) => cn(
          "flex flex-col items-center justify-center min-h-[48px] px-space-xs active:scale-95 transition-transform duration-100",
          isActive ? "text-secondary font-bold" : "text-on-surface-variant hover:bg-surface-container-low"
        )}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
          <span className="text-label-sm font-label-sm mt-0.5">Products</span>
        </NavLink>

        <NavLink to="/credit" className={({ isActive }) => cn(
          "flex flex-col items-center justify-center min-h-[48px] px-space-xs active:scale-95 transition-transform duration-100",
          isActive ? "text-secondary font-bold" : "text-on-surface-variant hover:bg-surface-container-low"
        )}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
          <span className="text-label-sm font-label-sm mt-0.5">Credit Ledger</span>
        </NavLink>

        <NavLink to="/insights" className={({ isActive }) => cn(
          "flex flex-col items-center justify-center min-h-[48px] px-space-xs active:scale-95 transition-transform duration-100",
          isActive ? "text-secondary font-bold" : "text-on-surface-variant hover:bg-surface-container-low"
        )}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          <span className="text-label-sm font-label-sm mt-0.5">Insights</span>
        </NavLink>
      </nav>
    </div>
  );
}
