import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { First } from "./first";
import RegisterForm from "./pages/Register";
import LoginForm from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import "./App.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <First />, 
    children: [
      { index: true, element: <RegisterForm /> }, 
      { path: "login", element: <LoginForm /> },
      { path: "forgot-password", element: <ForgotPassword /> },
    ],
  },
]);

const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
