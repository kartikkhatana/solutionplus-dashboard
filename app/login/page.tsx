"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string): boolean => {
    return email.toLowerCase().endsWith("solutionsplus@us.inc");
  };

  const handleEmailChange = (email: string) => {
    setCredentials({ ...credentials, email });
    
    if (email.trim() === '') {
      setEmailError('Email is required');
    } else if (!validateEmail(email)) {
      setEmailError('Invalid email address');
    } else {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    if (credentials.email.trim() === '') {
      setEmailError('Email is required');
    } else if (!validateEmail(credentials.email)) {
      setEmailError('Invalid email address');
    }
  };

  const handlePasswordChange = (password: string) => {
    setCredentials({ ...credentials, password });
    
    if (password.trim() === '') {
      setPasswordError('Password is required');
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }
  };

  const handlePasswordBlur = () => {
    if (credentials.password.trim() === '') {
      setPasswordError('Password is required');
    } else if (credentials.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    if (credentials.email.trim() === '') {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(credentials.email)) {
      setEmailError('Invalid email address');
      hasError = true;
    }

    if (credentials.password.trim() === '') {
      setPasswordError('Password is required');
      hasError = true;
    } else if (credentials.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full Width Gradient Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #89b6ff 30%, #6366F1 70%, #0f0617 100%)",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full">
          {/* Logo/Icon */}
          <div className="flex items-center w-40 h-10">
            <img src="/assets/Solutions-Logo.png" alt="Solutions+" />
          </div>
          
          {/* Main Text */}
          <div className="space-y-6">
            <p className="text-xl font-light">Streamline your workflow</p>
            <h1 className="text-5xl font-bold leading-tight">
              Automated invoice<br />
              reconciliation for<br />
              your business
            </h1>
          </div>
        </div>
      </div>

      {/* Right Side - Form (Absolute positioned with glassmorphism) */}
      <div 
        className="absolute z-10 right-0 top-0 bottom-0 w-full lg:w-[500px] xl:w-[600px] flex items-center justify-center p-8 rounded-l-3xl"
        style={{
          background: 'rgba(255, 255, 255, 1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
      >
        <div className="w-full max-w-md">
          {/* Icon */}
          {/* <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: "#6B46C1" }}>
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>
          </div> */}

          {/* Title */}
          <h1 className="text-4xl font-medium text-gray-900 mb-3">
            Sign in to your account
          </h1>
          <p className="text-gray-500 mb-8">
            Welcome back! Please enter your credentials to<br />
            access your invoice reconciliation dashboard.
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Your email
              </label>
              <input
                id="email"
                type="text"
                value={credentials.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl  focus:border-transparent transition-all text-gray-900 placeholder-gray-400 bg-white ${
                  emailError ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Enter your email"
                style={{ outline: 'none' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#6366F1'}
                onBlur={(e) => {
                  handleEmailBlur();
                  if (!emailError) e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl  focus:border-transparent transition-all text-gray-900 placeholder-gray-400 bg-white ${
                    passwordError ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Enter your password"
                  style={{ outline: 'none' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366F1'}
                  onBlur={(e) => {
                    handlePasswordBlur();
                    if (!passwordError) e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{
                background: loading ? "#6EA8FF" : "#6366F1",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#6366F1";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#6366F1";
                }
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          {/* <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or continue with</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div> */}

          {/* Social Login Buttons */}
          {/* <div className="grid grid-cols-3 gap-3">
            <button className="flex items-center justify-center py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </button>
            <button className="flex items-center justify-center py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>
            <button className="flex items-center justify-center py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
          </div> */}

          {/* Additional Info */}
          {/* <p className="text-center text-sm text-gray-600 mt-6">
            Need help?{" "}
            <a href="#" className="font-semibold hover:underline" style={{ color: "#6B46C1" }}>
              Contact support
            </a>
          </p> */}
        </div>
      </div>
    </div>
  );
}
