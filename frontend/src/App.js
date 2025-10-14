import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Components/Navbar';
import HeroSection from './Components/HeroSection';
import CueSheetGenerator from './Components/CueSheetGenerator';
import Signup from './Components/Signup';
import Login from './Components/Login';
import Dashboard from './Components/Dashboard';
import Footer from './Components/Footer';
import { CueSheetProvider } from './Hooks/CueSheetContext';
import ForAdmin from './Components/ForAdmin';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" />;      
};

const AdminProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token');
  const isAdmin = JSON.parse(localStorage.getItem('isAdmin')); 

  return isAuthenticated && isAdmin ? children : <Navigate to="/login" />;
};
function AppContent() {
  const location = useLocation();


  const noNavFooterRoutes = ['/login', '/signup'];


  const hideNavAndFooter = noNavFooterRoutes.includes(location.pathname) || location.pathname.startsWith('/dashboard');

  return (
    <>

      {!hideNavAndFooter && <Navbar />}


      <Routes>

        <Route path="/" element={<HeroSection />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />


        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/CueSheetGenerator"
          element={
            <ProtectedRoute>
              <CueSheetGenerator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <ForAdmin />
            </AdminProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>


      {!hideNavAndFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <CueSheetProvider>
      <Router>
        <AppContent />
      </Router>
    </CueSheetProvider>
  );
}

export default App;
