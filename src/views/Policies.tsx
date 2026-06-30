'use client';

import { useState } from 'react';
import PublicLayout from '@/components/PublicLayout';

/* ─────────────────────────────────────────────
   Shared animated wrapper  (same styling logic)
───────────────────────────────────────────── */
const AnimatedPolicyPage = ({
  title,
  mainContent,
  icon,
  children,
  banner,
}: {
  title: string;
  mainContent: React.ReactNode;
  icon: React.ReactNode;
  children: React.ReactNode;
  banner?: React.ReactNode;
}) => {

  return (
    <PublicLayout>
      {/* ── inline keyframes matching register page ── */}
      <style>{`
        @keyframes float1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-24px) scale(1.03)}}
        @keyframes float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(18px) scale(0.97)}}
        @keyframes float3{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bannerReveal{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}
        .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}
        .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
        .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}
        .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}
        .policy-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px hsl(var(--primary)/0.15)}
        .policy-card{transition:transform 0.25s ease,box-shadow 0.25s ease}
      `}</style>

      <div className="min-h-screen relative overflow-hidden">
        {/* ── background gradient (mirrors register left-panel palette) ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(160deg, hsl(var(--primary)/0.06) 0%, hsl(var(--background)) 50%, hsl(var(--secondary)/0.08) 100%)',
          }}
        />

        {/* floating orbs — same shapes as register page */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 380,
            height: 380,
            top: -80,
            right: -100,
            background:
              'radial-gradient(circle, hsl(var(--primary)/0.12), transparent 70%)',
            animation: 'float1 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 260,
            height: 260,
            bottom: 60,
            left: -80,
            background:
              'radial-gradient(circle, hsl(var(--secondary)/0.10), transparent 70%)',
            animation: 'float2 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 180,
            height: 180,
            top: '40%',
            left: '5%',
            background:
              'radial-gradient(circle, hsl(var(--primary)/0.07), transparent 70%)',
            animation: 'float3 9s ease-in-out infinite',
          }}
        />

        {/* ── optional banner slot ── */}
        {banner}

        {/* ── content ── */}
        <div
          className="container mx-auto px-4 py-12 relative z-10"
        >
          {/* page header */}
          <div className="text-center mb-14 fade-up-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Morpankh Saree
            </div>
            <h1
              className="text-5xl font-bold mb-4"
              style={{ color: 'hsl(var(--primary))' }}
            >
              {title}
            </h1>
          </div>

          {/* hero card */}
          <div className="max-w-3xl mx-auto mb-12 fade-up-2">
            <div
              className="rounded-2xl p-10 border border-border/60 shadow-xl backdrop-blur-xl"
              style={{ background: 'hsl(var(--card)/0.85)' }}
            >
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center text-4xl border border-primary/20 shadow-inner"
                  style={{ background: 'hsl(var(--primary)/0.08)' }}
                >
                  {icon}
                </div>
                <div className="space-y-4">{mainContent}</div>
              </div>
            </div>
          </div>

          {/* detail cards grid */}
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 fade-up-3">
            {children}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

/* shared detail card — uses primary palette */
const DetailCard = ({
  title,
  children,
  accent = 'primary',
}: {
  title: string;
  children: React.ReactNode;
  accent?: 'primary' | 'secondary';
}) => (
  <div
    className="policy-card rounded-xl p-6 border border-border/60"
    style={{
      background:
        accent === 'primary'
          ? 'hsl(var(--primary)/0.06)'
          : 'hsl(var(--secondary)/0.08)',
      borderLeft: '3px solid hsl(var(--primary)/0.5)',
    }}
  >
    <h3
      className="font-semibold text-base mb-3"
      style={{ color: 'hsl(var(--primary))' }}
    >
      {title}
    </h3>
    <div className="text-sm leading-relaxed text-muted-foreground">
      {children}
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   PRIVACY POLICY  — with top banner
═══════════════════════════════════════════ */
export const PrivacyPolicy = () => (
  <AnimatedPolicyPage
    title="Privacy Policy"
    icon="🔒"
    banner={
      /* ── Hero banner ── */
      <div className="relative w-full overflow-hidden banner-reveal" style={{ height: 260 }}>
        {/* gradient backdrop that matches register-page left panel */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(168 60% 18%))',
          }}
        />

        {/* dot-grid overlay — same as register page */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* floating shapes — mirrors register left panel */}
        <div
          className="absolute"
          style={{ top: '12%', left: '8%', animation: 'float1 8s ease-in-out infinite' }}
        >
          <div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" />
        </div>
        <div
          className="absolute"
          style={{ top: '50%', right: '10%', animation: 'float2 9s ease-in-out infinite' }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-white/20" />
        </div>
        <div
          className="absolute"
          style={{ bottom: '15%', left: '18%', animation: 'float3 7s ease-in-out infinite' }}
        >
          <div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" />
        </div>

        {/* banner text */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">
            Morpankh Saree · Legal
          </p>
          <h2 className="text-4xl font-bold mb-2">Your Privacy Matters</h2>
          <p className="text-white/70 text-sm max-w-md">
            We are committed to protecting your personal information and being
            transparent about how we use it.
          </p>
        </div>
      </div>
    }
    mainContent={
      <>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'hsl(var(--primary))' }}>
          Privacy Assured
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          When you place an order on our website, we collect only the basic
          information required to process and deliver your order:
        </p>
        <ul
          className="text-left space-y-2 text-sm rounded-xl my-4 p-5 border border-primary/15"
          style={{ background: 'hsl(var(--primary)/0.06)' }}
        >
          {['Name', 'Mobile number', 'Email address', 'Shipping address'].map((item) => (
            <li key={item} className="flex items-center gap-2 text-foreground">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: 'hsl(var(--primary))' }}
              />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          This information is used only for order processing, delivery, and
          customer support. Payment details are securely handled through
          Razorpay — we never store or share your payment information.
        </p>
      </>
    }
  >
    <DetailCard title="Information We Collect" accent="primary">
      <ul className="space-y-1.5">
        {['Name & Email', 'Phone & Address', 'Delivery details'].map((i) => (
          <li key={i} className="flex items-center gap-2">
            <span style={{ color: 'hsl(var(--primary))' }}>✓</span> {i}
          </li>
        ))}
      </ul>
    </DetailCard>
    <DetailCard title="Data Security" accent="secondary">
      Your data is protected with industry-standard security. Payment
      information is processed exclusively through the Razorpay gateway. We
      maintain the strictest confidentiality and never sell your data to
      third parties.
    </DetailCard>
  </AnimatedPolicyPage>
);

/* ═══════════════════════════════════════════
   REFUND POLICY
═══════════════════════════════════════════ */
export const RefundPolicy = () => (
  <AnimatedPolicyPage
    title=""
    icon="❌"
    banner={
      <div className="relative w-full overflow-hidden banner-reveal" style={{ height: 260 }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(168 60% 18%))',
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div
          className="absolute"
          style={{ top: '12%', right: '8%', animation: 'float1 8s ease-in-out infinite' }}
        >
          <div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" />
        </div>
        <div
          className="absolute"
          style={{ top: '50%', left: '10%', animation: 'float2 9s ease-in-out infinite' }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-white/20" />
        </div>
        <div
          className="absolute"
          style={{ bottom: '15%', right: '18%', animation: 'float3 7s ease-in-out infinite' }}
        >
          <div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" />
        </div>
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">
            Morpankh Saree · Legal
          </p>
          <h2 className="text-4xl font-bold mb-2">Refund & Exchange Policy</h2>
          <p className="text-white/70 text-sm max-w-md">
            Please review our policy carefully before placing your order. All
            sales are final once confirmed.
          </p>
        </div>
      </div>
    }
    mainContent={
      <>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'hsl(var(--primary))' }}>
          No Refund – No Exchange
        </h2>
        <p className="text-base text-muted-foreground">
          No refund is provided once the order is placed.
        </p>
        <p className="text-sm text-muted-foreground">
          No exchange is allowed under any circumstances. Customers are
          requested to check product details carefully before placing an order.
          By placing an order, you agree to this policy.
        </p>
      </>
    }
  >
    <DetailCard title="Key Points" accent="primary">
      <ul className="space-y-1.5">
        {['Final sale — no returns', 'No exchanges available', 'Check details before purchase'].map((i) => (
          <li key={i} className="flex items-center gap-2">
            <span style={{ color: 'hsl(var(--primary))' }}>✓</span> {i}
          </li>
        ))}
      </ul>
    </DetailCard>
    <DetailCard title="Important Notice" accent="secondary">
      Please ensure you are satisfied with your product selection before
      confirming your order. Once placed, orders cannot be cancelled,
      returned, or exchanged under any condition.
    </DetailCard>
  </AnimatedPolicyPage>
);

/* ═══════════════════════════════════════════
   SHIPPING POLICY
═══════════════════════════════════════════ */
export const ShippingPolicy = () => (
  <AnimatedPolicyPage
    title=""
    icon="📦"
    banner={
      <div className="relative w-full overflow-hidden banner-reveal" style={{ height: 260 }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(168 60% 18%))',
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div
          className="absolute"
          style={{ top: '15%', left: '12%', animation: 'float1 8s ease-in-out infinite' }}
        >
          <div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" />
        </div>
        <div
          className="absolute"
          style={{ bottom: '20%', right: '10%', animation: 'float2 9s ease-in-out infinite' }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-white/20" />
        </div>
        <div
          className="absolute"
          style={{ top: '45%', right: '20%', animation: 'float3 7s ease-in-out infinite' }}
        >
          <div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" />
        </div>
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">
            Morpankh Saree · Legal
          </p>
          <h2 className="text-4xl font-bold mb-2">Shipping & Delivery Policy</h2>
          <p className="text-white/70 text-sm max-w-md">
            Pan India delivery with secure packaging. Orders dispatched within
            2–3 working days.
          </p>
        </div>
      </div>
    }
    mainContent={
      <>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'hsl(var(--primary))' }}>
          6–7 Working Days
        </h2>
        <p className="text-base text-muted-foreground">
          We deliver products across India. Orders are dispatched within 2–3
          working days after confirmation, with delivery in 6–7 working days
          depending on location.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Delays caused by courier partners, weather conditions, or unforeseen
          circumstances are not under our control, but we will assist customers
          wherever possible.
        </p>
      </>
    }
  >
    <DetailCard title="Delivery Coverage" accent="primary">
      <ul className="space-y-1.5">
        {['Pan India shipping', 'Remote areas supported', 'Secure packaging'].map((i) => (
          <li key={i} className="flex items-center gap-2">
            <span style={{ color: 'hsl(var(--primary))' }}>📍</span> {i}
          </li>
        ))}
      </ul>
    </DetailCard>
    <DetailCard title="Timeline" accent="secondary">
      <ul className="space-y-1.5">
        {['Processing: 2–3 days', 'In transit: 6–7 days', 'Total avg: 8–10 days'].map((i) => (
          <li key={i} className="flex items-center gap-2">
            <span style={{ color: 'hsl(var(--primary))' }}>⏱</span> {i}
          </li>
        ))}
      </ul>
    </DetailCard>
  </AnimatedPolicyPage>
);

/* ═══════════════════════════════════════════
   TERMS & CONDITIONS
═══════════════════════════════════════════ */
const TERMS = [
  { n: 1, title: 'Introduction', body: 'We operate an online saree store. By accessing our website, you agree to be bound by these Terms and Conditions.' },
  { n: 2, title: 'Products & services', body: 'We sell handcrafted traditional sarees. Product images and descriptions may vary slightly due to screen settings or product quality variations.' },
  { n: 3, title: 'Pricing', body: 'All prices are displayed in Indian Rupees (₹) and are inclusive of GST. Prices are subject to change without notice.' },
  { n: 4, title: 'Orders & payments', body: 'Orders are placed online through our website. We use Razorpay as a secure payment gateway for all transactions.' },
  { n: 5, title: 'Cancellation policy', body: 'Orders once confirmed cannot be cancelled. Please ensure all details are correct before placing your order.' },
  { n: 6, title: 'Shipping & delivery', body: 'We deliver products across India. Delivery timelines may vary due to location, courier partners, and unforeseen circumstances.' },
  { n: 7, title: 'Return, refund & exchange', body: 'We follow a No Return, No Refund, No Exchange policy. Customers must contact us within 24 hours of delivery if there are any issues.' },
  { n: 8, title: 'User responsibilities', body: 'Customers must provide accurate and complete information. Fraudulent activities will result in order cancellation without prior notice.' },
  { n: 9, title: 'Intellectual property', body: 'All content including images, designs, and text are the exclusive property of Morpankh Saree. Unauthorized use is strictly prohibited.' },
  { n: 10, title: 'Limitation of liability', body: 'We are not responsible for delays caused by courier partners or circumstances beyond our control. Our maximum liability is limited to the product value.' },
  { n: 11, title: 'Governing law', body: 'These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of Indian courts.' },
  {
    n: 12, title: 'Contact information',
    body: '',
    contact: true,
  },
];

export const TermsAndConditions = () => (
  <AnimatedPolicyPage
    title=""
    icon="📋"
    banner={
      <div className="relative w-full overflow-hidden banner-reveal" style={{ height: 260 }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(168 60% 18%))',
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div
          className="absolute"
          style={{ top: '10%', right: '14%', animation: 'float1 8s ease-in-out infinite' }}
        >
          <div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" />
        </div>
        <div
          className="absolute"
          style={{ bottom: '18%', left: '8%', animation: 'float2 9s ease-in-out infinite' }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-white/20" />
        </div>
        <div
          className="absolute"
          style={{ top: '50%', left: '22%', animation: 'float3 7s ease-in-out infinite' }}
        >
          <div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" />
        </div>
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">
            Morpankh Saree · Legal
          </p>
          <h2 className="text-4xl font-bold mb-2">Terms & Conditions</h2>
          <p className="text-white/70 text-sm max-w-md">
            By using our website, you agree to the following terms. Please read
            them carefully before placing an order.
          </p>
        </div>
      </div>
    }
    mainContent={
      <>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'hsl(var(--primary))' }}>
          Welcome to Morpankh Saree
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          By accessing and using our website, you agree to be bound by these
          Terms and Conditions, along with our Shipping Policy, Cancellation &
          Refund Policy, and Privacy Policy. If you do not agree, please do not
          use our website.
        </p>
      </>
    }
  >
    {TERMS.map((t) => (
      <DetailCard key={t.n} title={`${t.n}. ${t.title}`} accent={t.n % 2 === 0 ? 'secondary' : 'primary'}>
        {t.contact ? (
          <>
            <p>For queries or support, contact us at:</p>
            <p className="mt-2">📧 morpankhsaree@gmail.com</p>
            <p>📞 917704862</p>
          </>
        ) : (
          t.body
        )}
      </DetailCard>
    ))}
  </AnimatedPolicyPage>
);

export default PrivacyPolicy;