// import { useState } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import PublicLayout from '@/components/PublicLayout';
// import { useStore } from '@/store/useStore';
// import { toast } from '@/hooks/use-toast';

// const Login = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const { login } = useStore();
//   const router = useRouter();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         // Store token in localStorage as backup
//         localStorage.setItem('token', data.token);
        
//         // Update store with user data and token
//         login(data.user, data.token);
        
//         toast({ title: 'Logged in successfully!' });
//         router.push('/profile');
//       } else {
//         toast({ 
//           title: 'Login failed', 
//           description: data.error || 'Invalid credentials',
//           variant: 'destructive'
//         });
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       toast({ 
//         title: 'Login failed', 
//         description: 'Network error. Please try again.',
//         variant: 'destructive'
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <PublicLayout>
//       <div className="container mx-auto px-4 py-16 max-w-md">
//         <div className="bg-card rounded-xl p-8 border border-border">
//           <h1 className="font-display text-2xl font-bold text-center mb-6">Customer Login</h1>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">Email</label>
//               <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">Password</label>
//               <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
//             </div>
//             <button type="submit" className="btn-primary w-full" disabled={isLoading}>
//               {isLoading ? 'Logging in...' : 'Login'}
//             </button>
//           </form>
//           <p className="text-center text-sm text-muted-foreground mt-4">
//             Don't have an account? <Link href="/register" className="text-primary font-medium">Register</Link>
//           </p>
//           <div className="border-t border-border mt-4 pt-4">
//             <Link href="/admin/login" className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors">
//               Admin? Login here →
//             </Link>
//           </div>
//         </div>
//       </div>
//     </PublicLayout>
//   );
// };

// export default Login;


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/PublicLayout';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { login } = useStore();
  const router = useRouter();

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Login received token:', data.token);
        localStorage.setItem('token', data.token);
        login(data.user, data.token);
        toast({ title: 'Logged in successfully!' });
        router.push('/');
      } else {
        toast({ title: 'Login failed', description: data.error || 'Invalid credentials', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Login failed', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full border rounded-xl px-4 py-3.5 bg-background text-sm transition-all duration-300 outline-none ${
      focused === field
        ? 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10'
        : 'border-border hover:border-primary/40'
    }`;

  return (
    <PublicLayout>
      <div className="min-h-screen flex relative overflow-hidden">
        <style>{`
          @keyframes float1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-24px) scale(1.03)} }
          @keyframes float2 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(18px) scale(0.97)} }
          @keyframes float3 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(12px)} }
          @keyframes slideIn { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
          @keyframes slideInR { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          .s1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
          .s2{opacity:0;animation:fadeUp 0.6s ease 0.2s forwards}
          .s3{opacity:0;animation:fadeUp 0.6s ease 0.3s forwards}
          .s4{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}
          .s5{opacity:0;animation:fadeUp 0.6s ease 0.5s forwards}
          .panel-left{opacity:0;animation:slideIn 0.8s cubic-bezier(0.22,1,0.36,1) 0s forwards}
          .panel-right{opacity:0;animation:slideInR 0.8s cubic-bezier(0.22,1,0.36,1) 0s forwards}
          .btn-main:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 10px 28px hsl(var(--primary)/0.4)}
          .btn-main{transition:all 0.25s ease}
          .orb-mouse{transition:transform 0.15s ease}
        `}</style>

        {/* Left decorative panel - hidden on mobile */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative panel-left"
          style={{ background: 'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(168 60% 18%))' }}>
          
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />

          {/* Floating decorative elements */}
          <div className="absolute" style={{ top: '15%', left: '10%', animation: 'float1 8s ease-in-out infinite' }}>
            <div className="w-20 h-20 rounded-2xl rotate-12 border-2 border-white/20 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
          <div className="absolute" style={{ top: '55%', right: '12%', animation: 'float2 9s ease-in-out infinite 1s' }}>
            <div className="w-14 h-14 rounded-full border-2 border-white/20" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div className="absolute" style={{ bottom: '20%', left: '15%', animation: 'float3 7s ease-in-out infinite' }}>
            <div className="w-10 h-10 rounded-lg rotate-45 border border-white/20" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          
          {/* Spinning ring */}
          <div className="absolute" style={{ top: '30%', right: '20%', animation: 'spinSlow 20s linear infinite' }}>
            <div className="w-24 h-24 rounded-full border border-dashed border-white/20" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium tracking-widest uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Premium products
              </div>
              <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight mb-4">
                परंपरेचा<br />
                <span className="text-white/80">आनंद होलसेल</span>
              </h2>
              <p className="text-white/70 text-base leading-relaxed max-w-sm">
                Discover handcrafted sarees that blend centuries of tradition with contemporary elegance.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { num: '10K+', label: 'Customers' },
                { num: '500+', label: 'Weavers' },
                { num: '25K+', label: 'Sarees Sold' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 rounded-xl bg-white/8 border border-white/10">
                  <div className="font-display text-xl font-bold">{stat.num}</div>
                  <div className="text-white/60 text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Login form */}
        <div className="flex-1 flex items-center justify-center px-6 py-16 relative panel-right"
          style={{ background: 'hsl(var(--background))' }}>
          
          {/* Subtle background glow following mouse on desktop */}
          <div className="absolute pointer-events-none hidden lg:block rounded-full"
            style={{
              width: 300, height: 300,
              left: mousePos.x * 0.05,
              top: mousePos.y * 0.05,
              background: 'radial-gradient(circle, hsl(var(--primary)/0.05), transparent 70%)',
              transition: 'left 0.3s ease, top 0.3s ease'
            }} />

          <div className="w-full max-w-sm relative z-10">
            {/* Logo / title area */}
            <div className="mb-8 s1">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Image src="/favicon.png" alt="Anand Wholesale" width={250} height={200} />
              </div>
              <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="s2 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  required
                  placeholder="you@example.com"
                  className={inputClass('email')}
                />
              </div>

              <div className="s3 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  required
                  placeholder="••••••••"
                  className={inputClass('password')}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-main s4 w-full py-3.5 rounded-xl font-semibold text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Signing in...
                  </span>
                ) : 'Sign In →'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6 s4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-muted-foreground s5">
              New to Anand Wholesale?{' '}
              <Link href="/register" className="font-semibold hover:underline underline-offset-4 transition-all"
                style={{ color: 'hsl(var(--primary))' }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Login;