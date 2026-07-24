import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiLock, FiMail, FiTruck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { email: '', password: '', remember: true } });
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/auth/login', data);
      setUser(response.data);
      toast.success('Welcome back');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-primary text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr,0.9fr]">
        <section className="flex flex-col justify-between px-6 py-8 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent"><FiTruck className="text-xl" /></div>
            <div>
              <div className="text-xl font-bold"> Logistics</div>
              <div className="text-sm text-slate-300">Consignment Management System</div>
            </div>
          </div>
          <div className="max-w-2xl py-16">
            <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">Enterprise LR, trip, and customer control for transport operations.</h1>
            <p className="mt-5 text-base leading-7 text-slate-300">Manage one customer database, assign consignments to trips, generate logistics receipts, and track shipment history from a secure admin workspace.</p>
          </div>
          <p className="text-sm text-slate-400">Admin-only access with JWT and HTTP-only cookies.</p>
        </section>
        <section className="flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl ring-1 ring-slate-200">
            <h2 className="text-2xl font-semibold text-slate-950">Admin Login</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to manage logistics operations.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <div className="relative mt-1">
                  <FiMail className="absolute left-3 top-3 text-slate-400" />
                  <input type="email" {...register('email', { required: true })} className="w-full rounded-md border border-slate-200 py-2.5 pl-10 pr-3 text-sm" />
                </div>
                {errors.email && <span className="mt-1 block text-xs text-red-600">Email is required</span>}
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <div className="relative mt-1">
                  <FiLock className="absolute left-3 top-3 text-slate-400" />
                  <input type="password" {...register('password', { required: true })} className="w-full rounded-md border border-slate-200 py-2.5 pl-10 pr-3 text-sm" />
                </div>
                {errors.password && <span className="mt-1 block text-xs text-red-600">Password is required</span>}
              </label>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <label className="flex items-center gap-2"><input type="checkbox" className="rounded" {...register('remember')} /> Remember me</label>
                <button type="button" className="font-semibold text-accent">Forgot password?</button>
              </div>
              <button disabled={isSubmitting} className="w-full rounded-md bg-accent px-5 py-3 font-semibold text-white disabled:opacity-70">
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;

