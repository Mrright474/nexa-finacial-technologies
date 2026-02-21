import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppProvider } from "@/context/AppContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Cards from "./pages/Cards";
import Crypto from "./pages/Crypto";
import Transfers from "./pages/Transfers";
import Trading from "./pages/Trading";
import BillPayments from "./pages/BillPayments";
import Savings from "./pages/Savings";
import Rewards from "./pages/Rewards";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/cards" element={<Cards />} />
              <Route path="/crypto" element={<Crypto />} />
              <Route path="/transfers" element={<Transfers />} />
              <Route path="/trading" element={<Trading />} />
              <Route path="/bills" element={<BillPayments />} />
              <Route path="/savings" element={<Savings />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
