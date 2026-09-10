import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './store/AppContext';
import MainLayout from './layouts/MainLayout';
import Billing from './pages/Billing';
import Products from './pages/Products';
import Credit from './pages/Credit';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import Checkout from './pages/Checkout';
import ShopName from './pages/onboarding/ShopName';
import StarterProducts from './pages/onboarding/StarterProducts';
import UPISetup from './pages/onboarding/UPISetup';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useAppContext();
  if (!settings.shopName) {
    return <Navigate to="/onboarding/step1" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding/step1" element={<ShopName />} />
          <Route path="/onboarding/step2" element={<StarterProducts />} />
          <Route path="/onboarding/step3" element={<UPISetup />} />
          
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/billing" replace />} />
            <Route path="billing" element={<Billing />} />
            <Route path="products" element={<Products />} />
            <Route path="credit" element={<Credit />} />
            <Route path="insights" element={<Insights />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
