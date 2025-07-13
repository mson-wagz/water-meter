import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {Droplets} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:5000/login', {
        email,
        password,
      });

      if (res.data.message === 'Login successful') {
        navigate('/dashboard');
      } else {
        alert('Invalid credentials');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-200 p-6 flex  justify-center'>
        <div className='w-96 bg-white rounded-lg shadow-md ' >
            <div>
                <div className='flex items-center justify-center py-4'>
                    <Droplets className='w-12 h-12 text-blue-600' />
                </div>
                <h2 className='text-2xl font-bold text-center mb-6'>Admin Login</h2>
                <p className='text-center font-normal'>Sign in to montor your water usage.</p>
            </div>
            <div className='mt-6 mb-16'>
                <form onSubmit={handleLogin} className='space-y-4 p-6'>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        required
                        onChange={(e) => setEmail(e.target.value)}
                        className='w-full px-4 py-2 border border-gray-300 mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        required
                        onChange={(e) => setPassword(e.target.value)}
                        className='w-full px-4 py-2 border border-gray-300 mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <button
                        type="submit"
                        className='w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200'
                    >
                        Login
                    </button>
                </form>
            </div>

        </div>

    </div>
    // <div style={{ maxWidth: 400, margin: '5rem auto' }}>
    //   <h2>Admin Login</h2>
    //   <form onSubmit={handleLogin}>
    //     <input
    //       type="email"
    //       placeholder="Email"
    //       value={email}
    //       required
    //       onChange={(e) => setEmail(e.target.value)}
    //       style={{ display: 'block', marginBottom: '1rem', width: '100%' }}
    //     />
    //     <input
    //       type="password"
    //       placeholder="Password"
    //       value={password}
    //       required
    //       onChange={(e) => setPassword(e.target.value)}
    //       style={{ display: 'block', marginBottom: '1rem', width: '100%' }}
    //     />
    //     <button type="submit">Login</button>
    //   </form>
    // </div>
  );
};

export default Login;
