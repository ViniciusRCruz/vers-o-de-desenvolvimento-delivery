/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import BottomNav from './components/BottomNav';

// Pages
import HomeList from './pages/HomeList';
import StoreView from './pages/Home'; // We'll rename usage internally, this is the current Product List
import AuthView from './pages/Auth';
import Checkout from './pages/Checkout';
import Tracking from './pages/Tracking';
import History from './pages/History';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="pb-16 md:pb-0 min-h-screen">
          <Routes>
            <Route path="/" element={<HomeList />} />
            <Route path="/store/:id" element={<StoreView />} />
            <Route path="/login" element={<AuthView />} />
            <Route path="/auth" element={<AuthView />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/tracking/:id" element={<Tracking />} />
            <Route path="/history" element={<History />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
          <BottomNav />
        </div>
      </Router>
    </AppProvider>
  );
}
