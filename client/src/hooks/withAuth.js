import e from 'cors';
import React from 'react';
import { Navigate } from 'react-router-dom';

const withAuth = (Component) => {
  const AuthRoute = (props) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const isExpired = (Number.parseInt(localStorage.getItem('expireTime')) < new Date().getTime())
    if (isExpired === true) {
      localStorage.clear();
    }
    if (isAuthenticated && !isExpired) {
      return <Component {...props} />;
    } else {
      return <Navigate to="/" />;
    }
  };

  return AuthRoute;
};

export default withAuth;