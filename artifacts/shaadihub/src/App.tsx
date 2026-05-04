import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VendorListing from "@/pages/VendorListing";
import VendorProfile from "@/pages/VendorProfile";
import UserDashboard from "@/pages/UserDashboard";
import VendorDashboard from "@/pages/VendorDashboard";
import AdminPanel from "@/pages/AdminPanel";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function Protected({ children, role }: { children: React.ReactNode; role?: "vendor" | "admin" }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen" />;
  if (!user) return <Login />;
  if (role === "vendor" && user.role === "user") return <Home />;
  if (role === "admin" && user.role !== "admin") return <Home />;
  return <>{children}</>;
}

function Shell() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/vendors" component={VendorListing} />
          <Route path="/vendors/:id" component={VendorProfile} />
          <Route path="/dashboard"><Protected><UserDashboard /></Protected></Route>
          <Route path="/vendor/dashboard"><Protected role="vendor"><VendorDashboard /></Protected></Route>
          <Route path="/admin"><Protected role="admin"><AdminPanel /></Protected></Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}> 
            <Switch>
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              <Route component={Shell} />
            </Switch>
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
