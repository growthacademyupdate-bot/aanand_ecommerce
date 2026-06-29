// "use client";

// import { useState } from 'react';
// import PublicLayout from '@/components/PublicLayout';
// import logo from '@/assets/logo.png';
// import Image from 'next/image';

// export default function Page() {
//   const [selectedImage, setSelectedImage] = useState<number | null>(null);

//   // Real gallery images from public folder
//   const galleryImages = [
//     { id: 1, src: '/IMG_8328.JPG.jpeg', alt: 'Shop Collection 1', category: 'Collection' },
//     { id: 2, src: '/IMG_8329.JPG.jpeg', alt: 'Shop Collection 2', category: 'Collection' },
//     { id: 3, src: '/IMG_8330.JPG.jpeg', alt: 'Shop Collection 3', category: 'Collection' },
//     { id: 4, src: '/IMG_8331.JPG.jpeg', alt: 'Shop Collection 4', category: 'Collection' },
//     { id: 5, src: '/IMG_8332.JPG.jpeg', alt: 'Shop Collection 5', category: 'Collection' },
//     { id: 6, src: '/IMG_8333.JPG.jpeg', alt: 'Shop Collection 6', category: 'Collection' },
//     { id: 7, src: '/IMG_8334.JPG.jpeg', alt: 'Shop Collection 7', category: 'Collection' },
//     { id: 8, src: '/IMG_8335.JPG.jpeg', alt: 'Shop Collection 8', category: 'Collection' },
//     { id: 9, src: '/IMG_8338.JPG.jpeg', alt: 'Shop Collection 9', category: 'Collection' },
//     { id: 10, src: '/IMG_8339.JPG.jpeg', alt: 'Shop Collection 10', category: 'Collection' },
//     { id: 11, src: '/IMG_8340.JPG.jpeg', alt: 'Shop Collection 11', category: 'Collection' },
//     { id: 12, src: '/IMG_8341.JPG.jpeg', alt: 'Shop Collection 12', category: 'Collection' },
//   ];

//   return (
//     <PublicLayout>
//       <style>{`
//         @keyframes float1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-24px) scale(1.03)}}
//         @keyframes float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(18px) scale(0.97)}}
//         @keyframes float3{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}
//         @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
//         @keyframes bannerReveal{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}
//         @keyframes zoomPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
//         @keyframes spinSlow{to{transform:rotate(360deg)}}
//         @keyframes galleryFadeIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
//         .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}
//         .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
//         .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}
//         .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}
//         .fade-up-4{opacity:0;animation:fadeUp 0.6s ease 0.55s forwards}
//         .gallery-item{opacity:0;animation:galleryFadeIn 0.6s ease forwards}
//         .gallery-item:nth-child(1){animation-delay:0.1s}
//         .gallery-item:nth-child(2){animation-delay:0.15s}
//         .gallery-item:nth-child(3){animation-delay:0.2s}
//         .gallery-item:nth-child(4){animation-delay:0.25s}
//         .gallery-item:nth-child(5){animation-delay:0.3s}
//         .gallery-item:nth-child(6){animation-delay:0.35s}
//         .gallery-item:nth-child(7){animation-delay:0.4s}
//         .gallery-item:nth-child(8){animation-delay:0.45s}
//         .gallery-item:nth-child(9){animation-delay:0.5s}
//         .gallery-item:nth-child(10){animation-delay:0.55s}
//         .gallery-item:nth-child(11){animation-delay:0.6s}
//         .gallery-item:nth-child(12){animation-delay:0.65s}
//         .gallery-item:hover{transform:scale(1.05);box-shadow:0 20px 40px hsl(var(--primary)/0.2)}
//         .gallery-item{transition:transform 0.3s ease,box-shadow 0.3s ease}
//         .logo-pulse{animation:zoomPulse 4s ease-in-out infinite}
//         .spin-ring{animation:spinSlow 22s linear infinite}
//         .modal-backdrop{backdrop-filter:blur(8px)}
//       `}</style>

//       <div className="min-h-screen relative overflow-hidden">
//         <div
//           className="absolute inset-0 pointer-events-none"
//           style={{
//             background:
//               'linear-gradient(160deg, hsl(var(--primary)/0.06) 0%, hsl(var(--background)) 50%, hsl(var(--secondary)/0.08) 100%)',
//           }}
//         />

//         <div
//           className="absolute rounded-full pointer-events-none"
//           style={{
//             width: 380,
//             height: 380,
//             top: -80,
//             right: -100,
//             background: 'radial-gradient(circle, hsl(var(--primary)/0.12), transparent 70%)',
//             animation: 'float1 10s ease-in-out infinite',
//           }}
//         />
//         <div
//           className="absolute rounded-full pointer-events-none"
//           style={{
//             width: 260,
//             height: 260,
//             bottom: 60,
//             left: -80,
//             background: 'radial-gradient(circle, hsl(var(--secondary)/0.10), transparent 70%)',
//             animation: 'float2 8s ease-in-out infinite',
//           }}
//         />
//         <div
//           className="absolute rounded-full pointer-events-none"
//           style={{
//             width: 180,
//             height: 180,
//             top: '40%',
//             left: '5%',
//             background: 'radial-gradient(circle, hsl(var(--primary)/0.07), transparent 70%)',
//             animation: 'float3 9s ease-in-out infinite',
//           }}
//         />

//         <div className="relative w-full overflow-hidden banner-reveal" style={{ height: 260 }}>
//           <div
//             className="absolute inset-0"
//             style={{
//               background: 'linear-gradient(160deg, hsl(var(--primary)/0.95), hsl(168 60% 18%))',
//             }}
//           />
//           <div
//             className="absolute inset-0 opacity-10"
//             style={{
//               backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
//               backgroundSize: '32px 32px',
//             }}
//           />
//           <div className="absolute" style={{ top: '12%', left: '8%', animation: 'float1 8s ease-in-out infinite' }}>
//             <div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" />
//           </div>
//           <div className="absolute" style={{ top: '50%', right: '10%', animation: 'float2 9s ease-in-out infinite' }}>
//             <div className="w-12 h-12 rounded-full border-2 border-white/20" />
//           </div>
//           <div className="absolute" style={{ bottom: '15%', left: '18%', animation: 'float3 7s ease-in-out infinite' }}>
//             <div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" />
//           </div>
//           <div className="absolute" style={{ top: '20%', right: '25%', animation: 'spinSlow 18s linear infinite' }}>
//             <div className="w-20 h-20 rounded-full border border-dashed border-white/15" />
//           </div>
//           <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
//             <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">
//               Morpankh Saree · Gallery
//             </p>
//             <h2 className="text-4xl font-bold mb-2">Gallery</h2>
//             <p className="text-white/70 text-sm max-w-md">
//               Explore our beautiful shop collection showcasing our finest products and store atmosphere.
//             </p>
//           </div>
//         </div>

//         <div className="container mx-auto px-4 py-12 relative z-10">
//           <div className="text-center mb-14 fade-up-1">
//             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">
//               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
//               Our Collection
//             </div>
           
//             <p className="text-muted-foreground max-w-2xl mx-auto">
//               Discover our beautiful shop collection showcasing our finest products and store atmosphere
//             </p>
//           </div>

//           <div className="max-w-6xl mx-auto mb-12 fade-up-2">
//             <div
//               className="rounded-2xl p-8 border border-border/60 shadow-xl backdrop-blur-xl"
//               style={{ background: 'hsl(var(--card)/0.85)' }}
//             >
//               <div className="text-center">
//                 <div className="relative inline-block mb-6">
//                   <div
//                     className="absolute inset-0 rounded-full spin-ring"
//                     style={{
//                       border: '2px dashed hsl(var(--primary)/0.25)',
//                       margin: '-12px',
//                     }}
//                   />
//                   <div
//                     className="w-24 h-24 rounded-2xl mx-auto flex items-center justify-center border border-primary/20 shadow-inner logo-pulse"
//                     style={{ background: 'hsl(var(--primary)/0.08)' }}
//                   >
//                     <Image src={logo} alt="Morpankh Logo" height={72} width={72} className="rounded-xl" />
//                   </div>
//                 </div>
//                 <div className="space-y-4">
//                   <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
//                     Our Shop Collection
//                   </h2>
//                   <p className="text-base text-muted-foreground leading-relaxed">
//                     Our gallery showcases the beautiful atmosphere of our shop and the quality products we offer, 
//                     carefully curated to provide the best shopping experience for our customers.
//                   </p>
//                   <div
//                     className="text-left space-y-2 text-sm rounded-xl my-4 p-5 border border-primary/15"
//                     style={{ background: 'hsl(var(--primary)/0.06)' }}
//                   >
//                     {[
//                       'Beautiful shop ambiance',
//                       'Quality products collection',
//                       'Customer-friendly environment',
//                       'Traditional & modern designs',
//                     ].map((item) => (
//                       <div key={item} className="flex items-center gap-2 text-foreground">
//                         <span
//                           className="w-1.5 h-1.5 rounded-full flex-shrink-0"
//                           style={{ background: 'hsl(var(--primary))' }}
//                         />
//                         {item}
//                       </div>
//                     ))}
//                   </div>
//                   <p className="text-sm text-muted-foreground">
//                     Browse through our gallery to explore our shop and discover the quality products we offer.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//       <div className="max-w-6xl mx-auto fade-up-3 px-4">
//   <style>{`
//     @keyframes cardReveal {
//       from { opacity: 0; transform: translateY(24px) scale(0.97); }
//       to   { opacity: 1; transform: translateY(0) scale(1); }
//     }
//     .pin-card {
//       animation: cardReveal 0.5s ease both;
//     }
//     .pin-card:hover {
//       transform: translateY(-4px) scale(1.02);
//       box-shadow: 0 20px 48px rgba(0,0,0,0.22);
//       z-index: 10;
//     }
//     .pin-card img {
//       transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
//     }
//     .pin-card:hover img {
//       transform: scale(1.1);
//     }
//     .pin-overlay {
//       background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, transparent 100%);
//       opacity: 0;
//       transition: opacity 0.35s ease;
//     }
//     .pin-card:hover .pin-overlay {
//       opacity: 1;
//     }
//     .pin-label {
//       transform: translateY(8px);
//       opacity: 0;
//       transition: transform 0.3s ease, opacity 0.3s ease;
//     }
//     .pin-card:hover .pin-label {
//       transform: translateY(0);
//       opacity: 1;
//     }
//     .pin-save {
//       opacity: 0;
//       transform: scale(0.85);
//       transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s;
//       pointer-events: none;
//     }
//     .pin-card:hover .pin-save {
//       opacity: 1;
//       transform: scale(1);
//       pointer-events: auto;
//     }
//   `}</style>

//   {/* Pinterest / Mosaic Grid */}
//   <div
//     className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 auto-rows-[140px] gap-3"
//     style={{ gridAutoFlow: 'dense' }}
//   >
//     {galleryImages.map((image, index) => {
//       const layouts = [
//         "row-span-2",
//         "",
//         "",
//         "row-span-2 md:col-span-2",
//         "row-span-2",
//         "",
//         "",
//         "md:col-span-2",
//       ];

//       return (
//         <div
//           key={image.id}
//           onClick={() => setSelectedImage(image.id)}
//           className={`pin-card relative overflow-hidden rounded-2xl cursor-pointer ${
//             layouts[index % layouts.length]
//           }`}
//           style={{
//             animationDelay: `${(index % 8) * 65}ms`,
//             transition: "transform 0.3s ease, box-shadow 0.3s ease",
//           }}
//         >
//           <Image
//             src={image.src}
//             alt={image.alt}
//             fill
//             className="object-cover"
//             sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
//           />

//           {/* Gradient overlay */}
//           <div className="pin-overlay absolute inset-0" />

//           {/* Label (optional — uses image.alt as fallback) */}
//           <div className="pin-label absolute bottom-0 left-0 right-0 p-3">
//             <p className="text-white text-sm font-semibold leading-tight drop-shadow">
//               {image.alt}
//             </p>
//           </div>
//         </div>
//       );
//     })}
//   </div>
// </div>
//         </div>
//       </div>
//     </PublicLayout>
//   );
// }


"use client";

import { useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import logo from '@/assets/logo.png';
import Image from 'next/image';

// ─── YouTube video data — edit src IDs or add more entries freely ───────────
const youtubeVideos = [
  {
    id: 'yt1',
    videoId: 'hLoOLaRmX-4',       // ← Replace with your YouTube video/short ID
    title: '',
    tag: '',
    isShort: true,
  },
  {
    id: 'yt2',
    videoId: 'SgwOSAOKTuY',       // ← Replace with your YouTube video/short ID
    isShort: true,
  },
  {
    id: 'yt3',
    videoId: 'Bmrv_j7oB3Y',       // ← Replace with your YouTube video/short ID
    title: 'Styling Tips',
    tag: 'Fashion',
    isShort: true,
  },
  {
    id: 'yt4',
    videoId: 'LWfsDxaRAYI',       // ← Replace with your YouTube video/short ID
    title: 'Festival Season Picks',
    tag: 'Trending',
    isShort: true,
  },
];

export default function Page() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const galleryImages = [
    { id: 1, src: '/IMG_8328.JPG.jpeg', alt: 'Shop Collection 1', category: 'Collection' },
    { id: 2, src: '/IMG_8329.JPG.jpeg', alt: 'Shop Collection 2', category: 'Collection' },
    { id: 3, src: '/IMG_8330.JPG.jpeg', alt: 'Shop Collection 3', category: 'Collection' },
    { id: 4, src: '/IMG_8331.JPG.jpeg', alt: 'Shop Collection 4', category: 'Collection' },
    { id: 5, src: '/IMG_8332.JPG.jpeg', alt: 'Shop Collection 5', category: 'Collection' },
    { id: 6, src: '/IMG_8333.JPG.jpeg', alt: 'Shop Collection 6', category: 'Collection' },
    { id: 7, src: '/IMG_8334.JPG.jpeg', alt: 'Shop Collection 7', category: 'Collection' },
    { id: 8, src: '/IMG_8335.JPG.jpeg', alt: 'Shop Collection 8', category: 'Collection' },
    { id: 9, src: '/IMG_8338.JPG.jpeg', alt: 'Shop Collection 9', category: 'Collection' },
    { id: 10, src: '/IMG_8339.JPG.jpeg', alt: 'Shop Collection 10', category: 'Collection' },
    { id: 11, src: '/IMG_8340.JPG.jpeg', alt: 'Shop Collection 11', category: 'Collection' },
    { id: 12, src: '/IMG_8341.JPG.jpeg', alt: 'Shop Collection 12', category: 'Collection' },
  ];

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
        @keyframes galleryFadeIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cardReveal{from{opacity:0;transform:translateY(24px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes playPulse{0%,100%{box-shadow:0 0 0 0 hsl(var(--primary)/0.5)}50%{box-shadow:0 0 0 16px hsl(var(--primary)/0)}}

        .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}
        .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
        .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}
        .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}
        .fade-up-4{opacity:0;animation:fadeUp 0.6s ease 0.55s forwards}
        .fade-up-5{opacity:0;animation:fadeUp 0.6s ease 0.7s forwards}

        .logo-pulse{animation:zoomPulse 4s ease-in-out infinite}
        .spin-ring{animation:spinSlow 22s linear infinite}

        /* Pinterest grid */
        .pin-card{animation:cardReveal 0.5s ease both;transition:transform 0.3s ease,box-shadow 0.3s ease}
        .pin-card:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 20px 48px rgba(0,0,0,0.22);z-index:10}
        .pin-card img{transition:transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)}
        .pin-card:hover img{transform:scale(1.1)}
        .pin-overlay{background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.1) 50%,transparent 100%);opacity:0;transition:opacity 0.35s ease}
        .pin-card:hover .pin-overlay{opacity:1}
        .pin-label{transform:translateY(8px);opacity:0;transition:transform 0.3s ease,opacity 0.3s ease}
        .pin-card:hover .pin-label{transform:translateY(0);opacity:1}

        /* YouTube section */
        .yt-card{animation:cardReveal 0.55s ease both;transition:transform 0.3s ease,box-shadow 0.35s ease}
        .yt-card:hover{transform:translateY(-6px);box-shadow:0 28px 56px hsl(var(--primary)/0.18)}
        .yt-thumbnail{transition:transform 0.6s ease}
        .yt-card:hover .yt-thumbnail{transform:scale(1.06)}
        .play-btn{animation:playPulse 2.5s ease-in-out infinite}
        .play-btn:hover{animation:none;transform:scale(1.12)}
        .play-btn{transition:transform 0.2s ease}
        .yt-tag{background:linear-gradient(135deg,hsl(var(--primary)/0.15),hsl(var(--primary)/0.05));border:1px solid hsl(var(--primary)/0.25)}
        .shorts-badge{background:linear-gradient(135deg,#ff0000,#cc0000);color:white;font-size:9px;font-weight:700;letter-spacing:0.08em;padding:2px 6px;border-radius:4px}

        /* Shimmer section divider */
        .shimmer-line{height:1px;background:linear-gradient(90deg,transparent,hsl(var(--primary)/0.6),hsl(var(--primary)/0.3),transparent);background-size:200% auto;animation:shimmer 3s linear infinite}

        /* Modal */
        .modal-backdrop{backdrop-filter:blur(12px)}
        .yt-iframe-wrapper{position:relative;padding-bottom:56.25%;height:0;overflow:hidden}
        .yt-iframe-wrapper.shorts-ratio{padding-bottom:177.78%}
        .yt-iframe-wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:12px}
      `}</style>

      <div className="min-h-screen relative overflow-hidden">

        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none" style={{background:'linear-gradient(160deg,hsl(var(--primary)/0.06) 0%,hsl(var(--background)) 50%,hsl(var(--secondary)/0.08) 100%)'}} />
        <div className="absolute rounded-full pointer-events-none" style={{width:380,height:380,top:-80,right:-100,background:'radial-gradient(circle,hsl(var(--primary)/0.12),transparent 70%)',animation:'float1 10s ease-in-out infinite'}} />
        <div className="absolute rounded-full pointer-events-none" style={{width:260,height:260,bottom:60,left:-80,background:'radial-gradient(circle,hsl(var(--secondary)/0.10),transparent 70%)',animation:'float2 8s ease-in-out infinite'}} />
        <div className="absolute rounded-full pointer-events-none" style={{width:180,height:180,top:'40%',left:'5%',background:'radial-gradient(circle,hsl(var(--primary)/0.07),transparent 70%)',animation:'float3 9s ease-in-out infinite'}} />

        {/* Hero Banner */}
        <div className="relative w-full overflow-hidden banner-reveal" style={{height:260}}>
          <div className="absolute inset-0" style={{background:'linear-gradient(160deg,hsl(var(--primary)/0.95),hsl(168 60% 18%))'}} />
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:`radial-gradient(circle at 2px 2px,white 1px,transparent 0)`,backgroundSize:'32px 32px'}} />
          <div className="absolute" style={{top:'12%',left:'8%',animation:'float1 8s ease-in-out infinite'}}><div className="w-16 h-16 rounded-2xl rotate-12 border-2 border-white/20" /></div>
          <div className="absolute" style={{top:'50%',right:'10%',animation:'float2 9s ease-in-out infinite'}}><div className="w-12 h-12 rounded-full border-2 border-white/20" /></div>
          <div className="absolute" style={{bottom:'15%',left:'18%',animation:'float3 7s ease-in-out infinite'}}><div className="w-8 h-8 rounded-lg rotate-45 border border-white/20" /></div>
          <div className="absolute" style={{top:'20%',right:'25%',animation:'spinSlow 18s linear infinite'}}><div className="w-20 h-20 rounded-full border border-dashed border-white/15" /></div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-3">Morpankh Saree · Gallery</p>
            <h2 className="text-4xl font-bold mb-2">Gallery</h2>
            <p className="text-white/70 text-sm max-w-md">Explore our beautiful shop collection showcasing our finest products and store atmosphere.</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">

          {/* Section heading */}
          <div className="text-center mb-14 fade-up-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Our Collection
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">Discover our beautiful shop collection showcasing our finest products and store atmosphere</p>
          </div>

          {/* Logo card */}
          <div className="max-w-6xl mx-auto mb-12 fade-up-2">
            <div className="rounded-2xl p-8 border border-border/60 shadow-xl backdrop-blur-xl" style={{background:'hsl(var(--card)/0.85)'}}>
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 rounded-full spin-ring" style={{border:'2px dashed hsl(var(--primary)/0.25)',margin:'-12px'}} />
                  <div className="w-24 h-24 rounded-2xl mx-auto flex items-center justify-center border border-primary/20 shadow-inner logo-pulse" style={{background:'hsl(var(--primary)/0.08)'}}>
                    <Image src={logo} alt="Morpankh Logo" height={72} width={72} className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold" style={{color:'hsl(var(--primary))'}}>Our Shop Collection</h2>
                  <p className="text-base text-muted-foreground leading-relaxed">Our gallery showcases the beautiful atmosphere of our shop and the quality products we offer, carefully curated to provide the best shopping experience for our customers.</p>
                  <div className="text-left space-y-2 text-sm rounded-xl my-4 p-5 border border-primary/15" style={{background:'hsl(var(--primary)/0.06)'}}>
                    {['Beautiful shop ambiance','Quality products collection','Customer-friendly environment','Traditional & modern designs'].map(item=>(
                      <div key={item} className="flex items-center gap-2 text-foreground">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:'hsl(var(--primary))'}} />{item}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Browse through our gallery to explore our shop and discover the quality products we offer.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pinterest Mosaic Grid */}
          <div className="max-w-6xl mx-auto fade-up-3 px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 auto-rows-[140px] gap-3" style={{gridAutoFlow:'dense'}}>
              {galleryImages.map((image,index)=>{
                const layouts=["row-span-2","","","row-span-2 md:col-span-2","row-span-2","","","md:col-span-2"];
                return (
                  <div key={image.id} onClick={()=>setSelectedImage(image.id)} className={`pin-card relative overflow-hidden rounded-2xl cursor-pointer ${layouts[index%layouts.length]}`} style={{animationDelay:`${(index%8)*65}ms`}}>
                    <Image src={image.src} alt={image.alt} fill className="object-cover" sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" />
                    <div className="pin-overlay absolute inset-0" />
                    <div className="pin-label absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-sm font-semibold leading-tight drop-shadow">{image.alt}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SHIMMER DIVIDER ─────────────────────────────────────── */}
          <div className="max-w-6xl mx-auto my-20 fade-up-4">
            <div className="flex items-center gap-6">
              <div className="flex-1 shimmer-line" />
              <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-primary/25 bg-primary/5">
                {/* YouTube icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="6" fill="#FF0000"/>
                  <path d="M19.8 8.2a2.5 2.5 0 0 0-1.76-1.77C16.73 6 12 6 12 6s-4.73 0-6.04.43A2.5 2.5 0 0 0 4.2 8.2 26 26 0 0 0 3.75 12a26 26 0 0 0 .45 3.8 2.5 2.5 0 0 0 1.76 1.77C7.27 18 12 18 12 18s4.73 0 6.04-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 20.25 12a26 26 0 0 0-.45-3.8Z" fill="white"/>
                  <path d="M10 14.5v-5l4.5 2.5-4.5 2.5Z" fill="#FF0000"/>
                </svg>
                <span className="text-primary text-xs font-semibold tracking-widest uppercase">Watch & Shop</span>
              </div>
              <div className="flex-1 shimmer-line" />
            </div>
          </div>

          {/* ── YOUTUBE VIDEOS SECTION ──────────────────────────────── */}
          <div className="max-w-6xl mx-auto fade-up-5">

            {/* Section header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/5 text-red-500 text-xs font-medium tracking-wide mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Videos & Shorts
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{color:'hsl(var(--foreground))'}}>See Us In Action</h2>
              <p className="text-muted-foreground text-sm max-w-xl mx-auto">Watch our latest YouTube videos and Shorts — from new arrivals to styling tips and behind-the-scenes.</p>
            </div>

            {/* Video grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
              {youtubeVideos.map((video, index)=>(
                <div
                  key={video.id}
                  className="yt-card self-start rounded-2xl overflow-hidden border border-border/60 cursor-pointer group"
                  style={{
                    background:'hsl(var(--card)/0.9)',
                    animationDelay:`${index*80}ms`,
                    backdropFilter:'blur(12px)',
                  }}
                  onClick={()=>setActiveVideo(video.videoId)}
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden" style={{aspectRatio: video.isShort ? '9/16' : '16/9'}}>
                    {/* YouTube thumbnail via hqdefault */}
                    <img
                      src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                      alt={video.title}
                      
                      className="yt-thumbnail w-full h-full object-cover"
                    />
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="play-btn w-14 h-14 rounded-full flex items-center justify-center" style={{background:'hsl(var(--primary))'}}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Shorts badge */}
                    {video.isShort && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="shorts-badge">SHORTS</span>
                      </div>
                    )}

                    {/* YouTube icon top-right */}
                    <div className="absolute top-2.5 right-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'rgba(0,0,0,0.55)'}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000">
                          <path d="M19.8 8.2a2.5 2.5 0 0 0-1.76-1.77C16.73 6 12 6 12 6s-4.73 0-6.04.43A2.5 2.5 0 0 0 4.2 8.2 26 26 0 0 0 3.75 12a26 26 0 0 0 .45 3.8 2.5 2.5 0 0 0 1.76 1.77C7.27 18 12 18 12 18s4.73 0 6.04-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 20.25 12a26 26 0 0 0-.45-3.8Z"/>
                          <path d="M10 14.5v-5l4.5 2.5-4.5 2.5Z" fill="white"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Card footer */}
                  {/* <div className="p-4">
                    <span className={`inline-block text-xs font-semibold rounded-md px-2.5 py-1 mb-2 yt-tag`} style={{color:'hsl(var(--primary))'}}>
                      {video.tag}
                    </span>
                    <p className="text-sm font-semibold text-foreground leading-snug">{video.title}</p>
                  </div> */}
                </div>
              ))}
            </div>

            {/* CTA to YouTube channel */}
            <div className="text-center mt-10">
              <a
                href="https://www.youtube.com/@Morpankhsaree" /* ← Replace with your YouTube channel URL */
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-xl"
                style={{background:'linear-gradient(135deg,#FF0000,#cc0000)',boxShadow:'0 4px 20px rgba(255,0,0,0.3)'}}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M19.8 8.2a2.5 2.5 0 0 0-1.76-1.77C16.73 6 12 6 12 6s-4.73 0-6.04.43A2.5 2.5 0 0 0 4.2 8.2 26 26 0 0 0 3.75 12a26 26 0 0 0 .45 3.8 2.5 2.5 0 0 0 1.76 1.77C7.27 18 12 18 12 18s4.73 0 6.04-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 20.25 12a26 26 0 0 0-.45-3.8Z"/>
                  <path d="M10 14.5v-5l4.5 2.5-4.5 2.5Z" fill="#FF0000"/>
                </svg>
                Subscribe on YouTube
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* ── VIDEO MODAL ─────────────────────────────────────────────── */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
          style={{background:'rgba(0,0,0,0.82)'}}
          onClick={()=>setActiveVideo(null)}
        >
          <div
            className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
            style={{maxWidth: youtubeVideos.find(v=>v.videoId===activeVideo)?.isShort ? 380 : 860}}
            onClick={e=>e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={()=>setActiveVideo(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
              style={{background:'rgba(0,0,0,0.6)'}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Embedded iframe */}
            <div className={`yt-iframe-wrapper ${youtubeVideos.find(v=>v.videoId===activeVideo)?.isShort ? 'shorts-ratio' : ''}`}>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}