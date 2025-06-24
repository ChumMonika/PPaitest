import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import Login from "@/pages/login";
import HeadDashboard from "@/pages/dashboard/head";
import AdminDashboard from "@/pages/dashboard/admin";
import MazerDashboard from "@/pages/dashboard/mazer";
import AssistantDashboard from "@/pages/dashboard/assistant";
import TeacherDashboard from "@/pages/dashboard/teacher";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to={`/dashboard/${user.role}`} />;
  }

  return <>{children}</>;
}

function DashboardRouter() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/dashboard/head">
        <ProtectedRoute allowedRoles={["head"]}>
          <HeadDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard/mazer">
        <ProtectedRoute allowedRoles={["mazer"]}>
          <MazerDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard/assistant">
        <ProtectedRoute allowedRoles={["assistant"]}>
          <AssistantDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard/teacher">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard/staff">
        <ProtectedRoute allowedRoles={["staff"]}>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>

      {/* Auto-redirect to role-specific dashboard */}
      <Route path="/dashboard">
        <ProtectedRoute>
          {user && <Redirect to={`/dashboard/${user.role}`} />}
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to={`/dashboard/${user.role}`} /> : <Login />}
      </Route>
      
      <Route path="/dashboard/:role*">
        <DashboardRouter />
      </Route>
      
      <Route path="/">
        {user ? <Redirect to={`/dashboard/${user.role}`} /> : <Redirect to="/login" />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
