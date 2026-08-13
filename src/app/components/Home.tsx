import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChefHat, User, TrendingUp, UtensilsCrossed, X } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            DineFlow <span className="text-orange-500">Pro</span>
          </h1>
          <p className="text-xl text-slate-300">
            Real-Time Restaurant Management System
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Captain Panel Card */}
          <Link
            to="/captain"
            className="group bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 mb-6 group-hover:bg-white/30 transition-all">
                <User className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Captain Panel</h2>
              <p className="text-blue-100">
                Accept/reject orders, manage table status & mark as served
              </p>
            </div>
          </Link>

          {/* Chef Panel Card */}
          <Link
            to="/chef"
            className="group bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-orange-500/50"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 mb-6 group-hover:bg-white/30 transition-all">
                <ChefHat className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Chef Panel</h2>
              <p className="text-orange-100">
                View cooking orders, update cooking status, and manage kitchen
              </p>
            </div>
          </Link>

          {/* Manager Panel Card */}
          <Link
            to="/manager"
            className="group bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-emerald-500/50"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 mb-6 group-hover:bg-white/30 transition-all">
                <TrendingUp className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Manager Panel</h2>
              <p className="text-emerald-100">
                Monitor tables, generate bills, and view analytics
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-full px-8 py-4 text-white">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-lg font-medium">System Online</span>
          </div>
        </div>
      </div>


    </div>
  );
}
