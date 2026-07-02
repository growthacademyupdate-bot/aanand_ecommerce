"use client";

import PublicLayout from '@/components/PublicLayout';
import logo from '@/assets/logo.png';
import Image from 'next/image';

export default function Page() {
  return (
    <PublicLayout>
      <style>{`
        @keyframes float1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-24px) scale(1.03)}}
        @keyframes float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(18px) scale(0.97)}}
        @keyframes float3{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bannerReveal{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}
        @keyframes zoomPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
        @keyframes spinSlow{to{transform:rotate(360deg)}}
        .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}
        .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
        .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}
        .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}
        .fade-up-4{opacity:0;animation:fadeUp 0.6s ease 0.55s forwards}
        .stat-card:hover{transform:translateY(-6px) scale(1.03);box-shadow:0 20px 48px hsl(var(--primary)/0.18)}
        .stat-card{transition:transform 0.3s ease,box-shadow 0.3s ease}
        .why-card:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 16px 40px hsl(var(--primary)/0.14)}
        .why-card{transition:transform 0.25s ease,box-shadow 0.25s ease}
        .logo-pulse{animation:zoomPulse 4s ease-in-out infinite}
        .spin-ring{animation:spinSlow 22s linear infinite}
      `}</style>

      <div className="min-h-screen relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(160deg, hsl(var(--primary)/0.06) 0%, hsl(var(--background)) 50%, hsl(var(--secondary)/0.08) 100%)',
          }}
        />

        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 380,
            height: 380,
            top: -80,
            right: -100,
            background: 'radial-gradient(circle, hsl(var(--primary)/0.12), transparent 70%)',
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
            background: 'radial-gradient(circle, hsl(var(--secondary)/0.10), transparent 70%)',
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
            background: 'radial-gradient(circle, hsl(var(--primary)/0.07), transparent 70%)',
            animation: 'float3 9s ease-in-out infinite',
          }}
        />

        <div className="relative w-full overflow-hidden banner-reveal" style={{ height: 260 }}>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(168 60% 18%))',
            }}
          />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
          <div className="absolute" style={{ top: '12%', left: '8%', animation: 'float1 8s ease-in-out infinite' }}>
            <div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" />
          </div>
          <div className="absolute" style={{ top: '50%', right: '10%', animation: 'float2 9s ease-in-out infinite' }}>
            <div className="w-12 h-12 rounded-full border-2 border-white/20" />
          </div>
          <div className="absolute" style={{ bottom: '15%', left: '18%', animation: 'float3 7s ease-in-out infinite' }}>
            <div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" />
          </div>
          <div className="absolute" style={{ top: '20%', right: '25%', animation: 'spinSlow 18s linear infinite' }}>
            <div className="w-20 h-20 rounded-full border border-dashed border-white/15" />
          </div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">
              Anand Wholesale · Our Story
            </p>
            <h2 className="text-4xl font-bold mb-2">About Us</h2>
            <p className="text-white/70 text-sm max-w-md">
              A timeless blend of tradition, craftsmanship, and elegance — bringing India's finest sarees to your wardrobe.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center mb-14 fade-up-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Anand Wholesale
            </div>
            <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }} />
          </div>

          <div className="max-w-6xl mx-auto mb-12 fade-up-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <div
                className="rounded-2xl p-10 border border-border/60 shadow-xl backdrop-blur-xl h-full flex flex-col justify-center"
                style={{ background: 'hsl(var(--card)/0.85)' }}
              >
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div
                      className="absolute inset-0 rounded-full spin-ring"
                      style={{
                        border: '2px dashed hsl(var(--primary)/0.25)',
                        margin: '-12px',
                      }}
                    />
                    <div
                      className="w-24 h-24 rounded-2xl mx-auto flex items-center justify-center border border-primary/20 shadow-inner logo-pulse"
                      style={{ background: 'hsl(var(--primary)/0.08)' }}
                    >
                      <Image src={logo} alt="Anand Wholesale Logo" height={72} width={72} className="rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
                      Our Mission
                    </h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Anand Wholesale is more than just a brand — it is a tribute to India's rich textile heritage.
                      From Banarasi silks to Paithani masterpieces, every saree represents generations of artistry.
                    </p>
                    <div
                      className="text-left space-y-2 text-sm rounded-xl my-4 p-5 border border-primary/15"
                      style={{ background: 'hsl(var(--primary)/0.06)' }}
                    >
                      {[
                        'Authentic handcrafted sarees',
                        'Direct from skilled artisans across India',
                        'Fair opportunities for traditional weavers',
                        "Preserving India's textile heritage",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-foreground">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: 'hsl(var(--primary))' }}
                          />
                          {item}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We work directly with skilled artisans across India, ensuring authenticity, quality, and fair opportunities for traditional weavers.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl border border-border/60 shadow-xl backdrop-blur-xl overflow-hidden h-full min-h-[400px] md:min-h-0 relative"
                style={{ background: 'hsl(var(--card)/0.85)' }}
              >
                <div className="absolute inset-0 w-full h-full">
                  <Image
                    src="/about_page_image_1.png"
                    alt="Anand Wholesale"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mb-10 fade-up-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { value: '10K+', label: 'Happy Customers', icon: '😊' },
                { value: '25K+', label: 'Sarees Sold', icon: '🧣' },
                { value: '500+', label: 'Weaver Partners', icon: '🧵' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="stat-card rounded-xl p-6 text-center border border-border/60"
                  style={{
                    background: 'hsl(var(--primary)/0.06)',
                    borderLeft: '3px solid hsl(var(--primary)/0.5)',
                    boxShadow: '0 4px 20px hsl(var(--primary)/0.08)',
                  }}
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <p className="text-3xl font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 fade-up-4">
            {[
              {
                title: 'Authentic Handcrafted',
                desc: 'Every saree is made by skilled artisans using traditional techniques passed down through generations.',
                icon: '🧵',
                accent: 'primary' as const,
              },
              {
                title: 'Premium Quality',
                desc: 'We ensure top-quality fabrics and craftsmanship in every product, from weave to finish.',
                icon: '✨',
                accent: 'secondary' as const,
              },
              {
                title: 'Trusted by Thousands',
                desc: 'Loved by customers across India with a 4.9★ satisfaction rating based on 200+ reviews.',
                icon: '⭐',
                accent: 'primary' as const,
              },
              {
                title: 'Weaver Partnerships',
                desc: 'We collaborate with 500+ artisan families, ensuring fair wages and sustainable craft preservation.',
                icon: '🤝',
                accent: 'secondary' as const,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="why-card rounded-xl p-6 border border-border/60"
                style={{
                  background:
                    item.accent === 'primary'
                      ? 'hsl(var(--primary)/0.06)'
                      : 'hsl(var(--secondary)/0.08)',
                  borderLeft: '3px solid hsl(var(--primary)/0.5)',
                }}
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-base mb-2" style={{ color: 'hsl(var(--primary))' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
