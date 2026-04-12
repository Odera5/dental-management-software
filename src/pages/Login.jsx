import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, HeartPulse } from "lucide-react";
import api from "../services/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  
  const canResendVerification = error === "Please confirm your email address to activate your account before signing in.";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      const token = res.data.accessToken || res.data.token;
      if (!token) throw new Error("No access token returned from API");
      const refreshToken = res.data.refreshToken;
      if (!refreshToken) throw new Error("No refresh token returned from API");
      const user = res.data.user;
      if (!user) throw new Error("No user data returned from API");

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("accessToken", token);
      storage.setItem("refreshToken", refreshToken);
      storage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message || err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError("Enter your email address first so we know where to send the verification link.");
      return;
    }
    try {
      setResending(true);
      setError("");
      setSuccess("");
      const response = await api.post("/auth/resend-verification", { email });
      setSuccess(
        response.data?.message || "A new verification email has been sent."
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "We could not resend the verification email."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-50 font-sans">
      {/* Left side - Branding/Image */}
      <div className="relative hidden w-1/2 lg:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-primary-900/60 to-primary-600/20 mix-blend-multiply" />
        <img
          src="/auth_bg.png"
          alt="Abstract Medical Tech"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-8 p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                <HeartPulse size={36} className="text-white" />
              </div>
            </div>
            <h1 className="mb-4 text-5xl font-semibold tracking-tight">
              PrimuxCare
            </h1>
            <p className="max-w-md text-lg text-primary-50">
              The modern, seamless operating system for forward-thinking clinics.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md space-y-8"
        >
          <div>
            <div className="mb-6 flex justify-center lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                <HeartPulse size={24} className="text-primary-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-2 text-slate-500">
              Sign in with your clinic staff account.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl bg-primary-50 p-4 text-sm text-primary-700 border border-primary-100"
            >
              {success}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@clinic.com"
              required
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
            </div>

            <Button type="submit" isLoading={loading} size="lg">
              Sign In
            </Button>
          </form>

          {canResendVerification && (
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 border border-amber-100">
              <p>Need another confirmation email?</p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="mt-2 font-medium text-amber-700 hover:text-amber-800 disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend verification email"}
              </button>
            </div>
          )}

          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">New Clinic?</h3>
            <p className="mt-1 text-sm text-slate-500">
              Set up your space and create the first admin account.
            </p>
            <Link
              to="/register-clinic"
              className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Create a free clinic account &rarr;
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
