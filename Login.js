import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=\"min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8\">
      <div className=\"max-w-md w-full space-y-8\">
        <div>
          <div className=\"flex justify-center\">
            <div className=\"w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center\">
              <span className=\"text-white font-bold text-2xl\">D</span>
            </div>
          </div>
          <h2 className=\"mt-6 text-center text-3xl font-bold text-secondary-900\">
            Connectez-vous à DJONA
          </h2>
          <p className=\"mt-2 text-center text-sm text-secondary-600\">
            Ou{' '}
            <Link
              to=\"/register\"
              className=\"font-medium text-primary-600 hover:text-primary-500\"
            >
              créez un nouveau compte
            </Link>
          </p>
        </div>
        
        <form className=\"mt-8 space-y-6\" onSubmit={handleSubmit}>
          {error && (
            <div className=\"bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md\">
              {error}
            </div>
          )}
          
          <div className=\"space-y-4\">
            <div>
              <label htmlFor=\"email\" className=\"block text-sm font-medium text-secondary-700\">
                Adresse email
              </label>
              <input
                id=\"email\"
                name=\"email\"
                type=\"email\"
                required
                className=\"input mt-1\"
                placeholder=\"votre@email.com\"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor=\"password\" className=\"block text-sm font-medium text-secondary-700\">
                Mot de passe
              </label>
              <input
                id=\"password\"
                name=\"password\"
                type=\"password\"
                required
                className=\"input mt-1\"
                placeholder=\"Votre mot de passe\"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type=\"submit\"
              disabled={loading}
              className=\"btn-primary btn-lg w-full\"
            >
              {loading ? (
                <div className=\"flex items-center justify-center\">
                  <div className=\"animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2\"></div>
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

