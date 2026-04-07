import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "../components/ProtectedRoute";
import { AppShell } from "../components/AppShell";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { RouteSkeleton } from "../components/RouteSkeleton";

const LoginPage = lazy(() => import("../pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import("../pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const CasesPage = lazy(() => import("../pages/CasesPage").then((m) => ({ default: m.CasesPage })));
const CaseDetailPage = lazy(() => import("../pages/CaseDetailPage").then((m) => ({ default: m.CaseDetailPage })));
const RecordsPage = lazy(() => import("../pages/RecordsPage").then((m) => ({ default: m.RecordsPage })));
const DocumentsPage = lazy(() => import("../pages/DocumentsPage").then((m) => ({ default: m.DocumentsPage })));
const ProceduresPage = lazy(() => import("../pages/ProceduresPage").then((m) => ({ default: m.ProceduresPage })));
const MeetingsPage = lazy(() => import("../pages/MeetingsPage").then((m) => ({ default: m.MeetingsPage })));
const AdminPage = lazy(() => import("../pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const AssistantPage = lazy(() => import("../pages/AssistantPage").then((m) => ({ default: m.AssistantPage })));

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>
        <ErrorBoundary>
          <Suspense fallback={<RouteSkeleton />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </AppShell>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Suspense fallback={<RouteSkeleton />}><LoginPage /></Suspense>} />
      <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
      <Route path="/cases" element={<ProtectedLayout><CasesPage /></ProtectedLayout>} />
      <Route path="/cases/:id" element={<ProtectedLayout><CaseDetailPage /></ProtectedLayout>} />
      <Route path="/records" element={<ProtectedLayout><RecordsPage /></ProtectedLayout>} />
      <Route path="/documents" element={<ProtectedLayout><DocumentsPage /></ProtectedLayout>} />
      <Route path="/procedures" element={<ProtectedLayout><ProceduresPage /></ProtectedLayout>} />
      <Route path="/meetings" element={<ProtectedLayout><MeetingsPage /></ProtectedLayout>} />
      <Route path="/assistant" element={<ProtectedLayout><AssistantPage /></ProtectedLayout>} />
      <Route path="/admin" element={<ProtectedLayout><AdminPage /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
