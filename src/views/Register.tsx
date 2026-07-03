import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/PublicLayout';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import Image from 'next/image';

const FloatingOrb = ({ style }: { style: React.CSSProperties }) => (
  <div className="absolute rounded-full pointer-events-none" style={style} />
);

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { login } = useStore();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: 'Registration successful! Please check your email for OTP.' });
        setStep('verify');
      } else {
        toast({ title: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Registration failed. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Please enter a valid 6-digit OTP', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        login(data.user, data.token);
        toast({ title: 'Account verified successfully! Welcome to Anand Wholesale.' });
        router.push('/');
      } else {
        toast({ title: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'OTP verification failed. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: 'OTP sent successfully! Please check your email.' });
      } else {
        toast({ title: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to resend OTP. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full border rounded-xl px-4 py-3 bg-background text-sm transition-all duration-300 outline-none ${
      focused === field
        ? 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10'
        : 'border-border hover:border-primary/40'
    }`;

  const verifyStep = (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />
        <FloatingOrb style={{ width: 300, height: 300, top: -60, right: -80, background: 'radial-gradient(circle, hsl(var(--primary)/0.15), transparent 70%)' }} />
        <FloatingOrb style={{ width: 200, height: 200, bottom: 40, left: -60, background: 'radial-gradient(circle, hsl(var(--secondary)/0.12), transparent 70%)', animation: 'float2 7s ease-in-out infinite' }} />

        <style>{`
          @keyframes float1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-18px) rotate(3deg)} }
          @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(14px)} }
          @keyframes slideUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
          @keyframes fadeScale { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
          .slide-up { animation: slideUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
          .fade-scale { animation: fadeScale 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        `}</style>

        <div className="relative z-10 w-full max-w-md fade-scale">
          {/* Decorative top badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Verify Your Identity
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-8 shadow-2xl">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-3xl shadow-inner">
                📧
              </div>
            </div>

            <h1 className="font-display text-2xl font-bold text-center mb-2">Check Your Inbox</h1>
            <p className="text-center text-muted-foreground text-sm mb-1">
              We've sent a 6-digit code to
            </p>
            <p className="text-center font-medium text-primary text-sm mb-8">{form.email}</p>

            {/* OTP Input */}
            <div className="flex justify-center mb-6">
              <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map(i => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 mb-3 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Verifying...
                </span>
              ) : 'Verify & Continue →'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button onClick={handleResendOTP} disabled={isLoading} className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
                Resend code
              </button>
              <button onClick={() => setStep('register')} className="text-muted-foreground hover:text-primary transition-colors">
                ← Change email
              </button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );

  if (step === 'verify') return verifyStep;


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
      `}</style>

      {/* LEFT PANEL (SAME AS LOGIN) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative panel-left"
        style={{ background: 'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(168 60% 18%))' }}>

        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* floating shapes */}
        <div className="absolute" style={{ top: '15%', left: '10%', animation: 'float1 8s ease-in-out infinite' }}>
          <div className="w-20 h-20 rounded-2xl rotate-12 border-2 border-white/20" />
        </div>

        <div className="absolute" style={{ top: '55%', right: '12%', animation: 'float2 9s ease-in-out infinite' }}>
          <div className="w-14 h-14 rounded-full border-2 border-white/20" />
        </div>

        <div className="absolute" style={{ bottom: '20%', left: '15%', animation: 'float3 7s ease-in-out infinite' }}>
          <div className="w-10 h-10 rounded-lg rotate-45 border border-white/20" />
        </div>

        {/* TEXT */}
        <div className="relative z-10 flex flex-col py-20 px-12 text-white">
          <div className="flex justify-start gap-2 mb-6">
            <Image src="/favicon.png" alt="Anand Wholesale" width={200} height={200} />
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Join<br />
            <span className="text-white/80">Anand Wholesale</span>
          </h2>
          <p className="text-white/70 text-sm">
            Create your account and explore premium products.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 panel-right">
        <div className="w-full max-w-sm">

          {/* HEADER */}
          <div className="mb-8 s1">
            <h1 className="text-3xl font-bold mb-2">
              Create <span style={{ color: 'hsl(var(--primary))' }}>Account</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Start your journey with us
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleRegister} className="space-y-5">

            {/* NAME */}
            <div className="s2">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full Name"
                className={inputClass('name')}
                required
              />
            </div>

            {/* EMAIL */}
            <div className="s3">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className={inputClass('email')}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="s4">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password"
                className={inputClass('password')}
                required
              />
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="s5">
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Confirm Password"
                className={inputClass('confirm')}
                required
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-main w-full py-3.5 rounded-xl font-semibold text-sm"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {isLoading ? 'Creating...' : 'Create Account →'}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  </PublicLayout>
);
};

export default Register;