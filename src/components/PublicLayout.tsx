import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import RecentOrdersToast from './RecentOrdersToast';
import { MessageCircle, Youtube } from 'lucide-react';



const PublicLayout = ({ children }: { children: ReactNode }) => {

  return (

    <div className="min-h-screen flex flex-col">

      <Navbar />

      <main className="flex-1">{children}</main>

      <Footer />



      <style>{`

        @keyframes floatAttention {

          0%, 100% { transform: translateY(0); }

          50% { transform: translateY(-6px); }

        }

        @keyframes pulseRing {

          0% { transform: scale(0.95); opacity: 0.55; }

          70% { transform: scale(1.35); opacity: 0; }

          100% { transform: scale(1.35); opacity: 0; }

        }

        .floating-action {

          animation: floatAttention 2.6s ease-in-out infinite;

        }

        .floating-action:hover {

          animation-play-state: paused;

        }

        .floating-action:hover .floating-ring {

          animation-play-state: paused;

        }

        .floating-ring {

          animation: pulseRing 2.2s ease-out infinite;

        }

      `}</style>



      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">

        <a

          href="https://api.whatsapp.com/send/?phone=919096971199&text&type=phone_number&app_absent=0"

          target="_blank"

          rel="noopener noreferrer"

          aria-label="Chat on WhatsApp"

          className="floating-action relative h-12 w-12 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105"

          style={{ background: '#25D366', color: 'white' }}

        >

          <span

            className="floating-ring absolute inset-0 rounded-full"

            style={{ boxShadow: '0 0 0 0 rgba(37, 211, 102, 0.6)' }}

          />

          <img
            src="/wp_icon1.png"
            alt="WhatsApp"
            className="w-full h-full object-cover rounded-full"
          />

        </a>



        <a

          href="https://www.youtube.com/channel/UCH331lbGaXrlDH4Qua-YA9g"

          target="_blank"

          rel="noopener noreferrer"

          aria-label="Open YouTube"

          className="floating-action relative h-12 w-12 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105"

          style={{ background: '#FF0000', color: 'white' }}

        >

          <span

            className="floating-ring absolute inset-0 rounded-full"

            style={{ boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.55)' }}

          />

          <Youtube className="h-6 w-6" />

        </a>

      </div>

      <RecentOrdersToast />
    </div>

  );

};



export default PublicLayout;

