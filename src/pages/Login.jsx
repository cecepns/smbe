import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Database, Loader2 } from 'lucide-react';
import authService from '../services/authService';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authService.login(formData.email, formData.password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(''); // Clear error when user types
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-3 mb-6">
            <div className="h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <Database className="h-7 w-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">FMM-Service</h1>
              <p className="text-sm text-gray-500">Sistem Manajemen Breakdown Equipment</p>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Masuk ke Akun Anda
          </h2>
          <p className="mt-2 text-gray-600">
            Silakan masuk menggunakan kredensial Anda
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="masukkan@email.anda"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-colors"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Ingat saya
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Lupa password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Masuk'
                )}
              </button>
            </div>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Demo Accounts:</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Admin:</span>
                <div className="text-right">
                  <div>admin@smbe.com</div>
                  <div className="text-gray-500">password: admin123</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Inputer:</span>
                <div className="text-right">
                  <div>inputer@smbe.com</div>
                  <div className="text-gray-500">password: inputer123</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Viewer:</span>
                <div className="text-right">
                  <div>viewer@smbe.com</div>
                  <div className="text-gray-500">password: viewer123</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Report Viewer:</span>
                <div className="text-right">
                  <div>report_viewer@smbe.com</div>
                  <div className="text-gray-500">password: report123</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Inputer Site A:</span>
                <div className="text-right">
                  <div>inputer_a@smbe.com</div>
                  <div className="text-gray-500">password: inputer123</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
              Hubungi administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;