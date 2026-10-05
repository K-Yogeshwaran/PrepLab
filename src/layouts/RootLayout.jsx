import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import MobileBottomNav from '../components/MobileBottomNav';
import Footer from '../components/Footer';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col lg:flex-row antialiased selection:bg-brand-100 selection:text-brand-900">
      {/* 1. Desktop Sidebar (>= 1024px) */}
      <div className="hidden lg:block lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* 2. Main App Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Tablet & Mobile Top Header (< 1024px) */}
        <TopNav />

        {/* Dynamic Page Content */}
        <main className="flex-1 w-full max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 pb-20 md:pb-8">
          <Outlet />
        </main>

        {/* Global Footer */}
        <Footer />

        {/* Mobile Fixed Bottom Navigation Bar (< 768px) */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
