import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import { Spinner } from './components/ui';
import Landing from './pages/Landing';
import { homeFor } from './utils/routes';
import { Login, Register } from './pages/Auth';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Classes = lazy(() => import('./pages/Classes'));
const ClassDetail = lazy(() => import('./pages/class/ClassDetail'));
const AssignmentDetail = lazy(() => import('./pages/class/AssignmentDetail'));
const LiveSession = lazy(() => import('./pages/LiveSession'));
const Tutors = lazy(() => import('./pages/Tutors'));
const TutorProfile = lazy(() => import('./pages/TutorProfile'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const Focus = lazy(() => import('./pages/Focus'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Grades = lazy(() => import('./pages/Grades'));

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner className="min-h-screen" />;
  return user ? <Navigate to={homeFor(user)} replace /> : children;
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <p className="mt-2 text-slate-500">This page does not exist.</p>
      <a href="/" className="mt-6 text-brand-600 hover:underline">Go home</a>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Spinner className="min-h-screen" />}>
      <Routes>
        <Route path="/" element={<GuestOnly><Landing /></GuestOnly>} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

        <Route path="/live/:classId/:sessionId" element={<RequireAuth><LiveSession /></RequireAuth>} />
        <Route path="/meet/:bookingId" element={<RequireAuth><LiveSession oneOnOne /></RequireAuth>} />

        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/dashboard" element={<RequireAuth roles={['student', 'tutor']}><Dashboard /></RequireAuth>} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/:classId" element={<ClassDetail />} />
          <Route path="/classes/:classId/assignments/:assignmentId" element={<AssignmentDetail />} />
          <Route path="/tutors" element={<Tutors />} />
          <Route path="/tutors/:id" element={<TutorProfile />} />
          <Route path="/bookings" element={<RequireAuth roles={['student', 'tutor']}><Bookings /></RequireAuth>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/grades" element={<RequireAuth roles={['student']}><Grades /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth roles={['admin']}><Admin /></RequireAuth>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
