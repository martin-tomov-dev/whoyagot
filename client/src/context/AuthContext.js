import { useContext } from 'react';
import { createContext, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

const initial_state = {
  type: localStorage.getItem('type'),
  loggedIn: localStorage.getItem('token') ? true : false,
  token: localStorage.getItem('token'),
  expiration: localStorage.getItem('expiration'),
};

export const AuthContextProvider = (props) => {
  const [authState, setAuthState] = useState(initial_state);
  const navigate = useNavigate();

  const Login = (type = 'user', token) => {
    setAuthState({
      type,
      loggedIn: true,
      token,
    });

    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 2);
    localStorage.setItem('type', type);
    localStorage.setItem('expiration', expiration.toISOString());
    localStorage.setItem('token', token);

    if (type === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/data', { replace: true });
    }
  };

  const Logout = () => {
    setAuthState({
      type: null,
      loggedIn: false,
      token: null,
      expiration: null,
    });
    localStorage.removeItem('type');
    localStorage.removeItem('expiration');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ authState, Login, Logout }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export function RequireAdminAuth({ children }) {
  const { authState, Logout } = useContext(AuthContext);

  if (!authState.loggedIn || authState.type !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  if (getTokenDuration() < 0) {
    Logout();
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export function RequireAuth({ children }) {
  const { authState, Logout } = useContext(AuthContext);

  if (!authState.loggedIn) {
    return <Navigate to="/" replace />;
  }
  if (getTokenDuration() < 0) {
    Logout();
    return <Navigate to="/" replace />;
  }

  return children;
}

function getTokenDuration() {
  const expirationDateStored = localStorage.getItem('expiration');
  const expirationDate = new Date(expirationDateStored);
  const now = new Date();
  const duration = expirationDate.getTime() - now.getTime();
  return duration;
}