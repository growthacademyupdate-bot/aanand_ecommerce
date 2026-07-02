import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import { ShieldCheck } from 'lucide-react';
import logo from '@/assets/logo.png';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import Image from 'next/image';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'login' | 'verify'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'OTP sent to your admin email' });
        setStep('verify');
      } else {
        toast({ title: data.error || 'Invalid admin credentials', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to send OTP. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Please enter a valid 6-digit OTP', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token, true);
        toast({ title: 'Welcome, Admin!' });
        router.push('/admin');
      } else {
        toast({ title: data.error || 'Invalid OTP', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'OTP verification failed. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div className="min-h-screen flex relative overflow-hidden">
    <style>{`
      @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
      @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(14px)} }
      @keyframes slideIn { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
      @keyframes slideInR { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
      @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

      .panel-left{opacity:0;animation:slideIn 0.8s ease forwards}
      .panel-right{opacity:0;animation:slideInR 0.8s ease forwards}
      .s1{animation:fadeUp 0.6s ease 0.1s both}
      .s2{animation:fadeUp 0.6s ease 0.2s both}
      .s3{animation:fadeUp 0.6s ease 0.3s both}
      .btn-main:hover{transform:translateY(-2px);box-shadow:0 10px 25px hsl(var(--primary)/0.4)}
    `}</style>

    {/* LEFT PANEL */}
    <div className="hidden lg:flex lg:w-1/2 relative panel-left"
      style={{ background: 'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(220 60% 18%))' }}>

      {/* floating shapes */}
      <div className="absolute top-20 left-16" style={{ animation: 'float1 8s ease-in-out infinite' }}>
        <div className="w-20 h-20 border border-white/20 rounded-2xl rotate-12" />
      </div>

      <div className="absolute bottom-20 right-20" style={{ animation: 'float2 7s ease-in-out infinite' }}>
        <div className="w-14 h-14 border border-white/20 rounded-full" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col justify-center px-16 text-white">
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs uppercase tracking-widest">
          <ShieldCheck className="h-3 w-3" />
          Admin Access
        </div>

        <h2 className="text-4xl font-bold leading-tight mb-4">
          Secure <br />
          <span className="text-white/70">Dashboard Login</span>
        </h2>

        <p className="text-white/70 text-sm max-w-sm">
          Access Anand Wholesale admin panel securely with OTP verification and encrypted authentication.
        </p>

        {/* small stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { num: '100%', label: 'Secure' },
            { num: '24/7', label: 'Access' },
            { num: 'OTP', label: 'Protected' },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 rounded-xl bg-white/10 border border-white/10">
              <p className="font-bold">{item.num}</p>
              <p className="text-xs text-white/60">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* RIGHT PANEL */}
    <div className="flex-1 flex items-center justify-center px-6 py-16 panel-right">
      <div className="w-full max-w-sm">

        {/* HEADER */}
        <div className="text-center mb-8 s1">

          <Image src={logo} alt="logo" height={200} width={200} className="mx-auto" />
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-muted-foreground text-sm">
            Secure access to dashboard
          </p>
        </div>

        {step === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-4 s2">

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin Email"
              required
              className="w-full border rounded-xl px-4 py-3 bg-background text-sm focus:ring-2 focus:ring-primary/20"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full border rounded-xl px-4 py-3 bg-background text-sm focus:ring-2 focus:ring-primary/20"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="btn-main w-full py-3 rounded-xl font-semibold text-sm bg-primary text-white"
            >
              {isLoading ? 'Sending OTP...' : 'Continue →'}
            </button>
          </form>
        ) : (
          <div className="space-y-5 s3">

            <p className="text-center text-sm text-muted-foreground">
              Enter OTP sent to <strong>{email}</strong>
            </p>

            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={(v) => setOtp(v)}>
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map(i => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.length !== 6}
              className="btn-main w-full py-3 rounded-xl font-semibold text-sm bg-primary text-white"
            >
              {isLoading ? 'Verifying...' : 'Verify & Login →'}
            </button>

            <button
              onClick={() => { setStep('login'); setOtp(''); }}
              className="text-sm text-primary text-center w-full hover:underline"
            >
              Change Email
            </button>
          </div>
        )}

        {/* FOOTER */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Protected by secure OTP authentication
        </p>
      </div>
    </div>
  </div>
);
};

export default AdminLogin;
