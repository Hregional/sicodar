// src/App.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import InsumosPage from './pages/InsumosPage.jsx';
import MovimientosPage from './pages/MovimientosPage.jsx';
import KardexPage from './pages/KardexPage.jsx';
import FacturasPage from './pages/FacturasPage.jsx';
import AlertasPage from './pages/AlertasPage.jsx';
import StockBajoPage from './pages/StockBajoPage.jsx';
import ProximosAVencerPage from './pages/ProximosAVencerPage.jsx';
import ReportesBIPage from './pages/ReportesBIPage.jsx';
import CrearUsuariosPage from './pages/CrearUsuariosPage.jsx';
import AuditoriaPage from './pages/AuditoriaPage.jsx';
import RequisicionesPage from './pages/RequisicionesPage.jsx';
import DespachoPage from './pages/DespachoPage.jsx';
import api from './services/api.js';
import {
  getToken,
  getUser,
  isTokenExpired,
  removeToken,
  saveUser,
} from './utils/Auth.js';

const LoadingScreen = () => (
  <div className="grid min-h-screen place-items-center bg-slate-100">
    <div className="flex flex-col items-center gap-4 text-slate-500">
      <span className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-primary-500" />
      <p className="text-sm font-medium uppercase tracking-wider">
        Cargando…
      </p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles, user, loading, isAuth }) => {
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length) {
    const hasAccess = user && allowedRoles.includes(user.rol);
    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

function App() {
  const [user, setUser] = useState(() => getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = getToken();
    return Boolean(token && !isTokenExpired(token) && getUser());
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token || isTokenExpired(token)) {
      removeToken();
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    api
      .get('/usuarios/me')
      .then(({ data }) => {
        if (mounted) {
          saveUser(data);
          setUser(data);
          setIsAuthenticated(true);
        }
      })
      .catch((error) => {
        console.error('Error verificando sesión:', error);
        removeToken();
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const protectedRouteProps = useMemo(
    () => ({
      user,
      loading,
      isAuth: isAuthenticated,
    }),
    [user, loading, isAuthenticated]
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute {...protectedRouteProps}>
              <Dashboard user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insumos"
          element={
            <ProtectedRoute {...protectedRouteProps}>
              <InsumosPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movimientos"
          element={
            <ProtectedRoute {...protectedRouteProps}>
              <MovimientosPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requisiciones"
          element={
            <ProtectedRoute {...protectedRouteProps}>
              <RequisicionesPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kardex/:insumoId?"
          element={
            <ProtectedRoute {...protectedRouteProps}>
              <KardexPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/facturas"
          element={
            <ProtectedRoute {...protectedRouteProps}>
              <FacturasPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/despacho"
          element={
            <ProtectedRoute {...protectedRouteProps}>
              <DespachoPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alertas"
          element={
            <ProtectedRoute {...protectedRouteProps}>
              <AlertasPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock-bajo"
          element={
            <ProtectedRoute {...protectedRouteProps}>
              <StockBajoPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/proximos-a-vencer"
          element={
            <ProtectedRoute {...protectedRouteProps}>
              <ProximosAVencerPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes-bi"
          element={
            <ProtectedRoute
              {...protectedRouteProps}
              allowedRoles={['super_admin', 'admin']}
            >
              <ReportesBIPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auditoria"
          element={
            <ProtectedRoute
              {...protectedRouteProps}
              allowedRoles={['super_admin', 'admin']}
            >
              <AuditoriaPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crear-usuarios"
          element={
            <ProtectedRoute
              {...protectedRouteProps}
              allowedRoles={['super_admin']}
            >
              <CrearUsuariosPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

