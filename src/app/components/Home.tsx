import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChefHat, User, TrendingUp, UtensilsCrossed, X, Utensils } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            Smart Dining
          </h1>
          <p className="text-xl text-slate-300">
            Real-Time Restaurant Management System
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Order Panel Card */}
          <Link
            to="/user"
            className="group bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 mb-6 group-hover:bg-white/30 transition-all">
                <Utensils className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Order Panel</h2>
              <p className="text-purple-100">
                Browse menu, place orders & track order status
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
                View orders, accept/reject, manage cooking status
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
