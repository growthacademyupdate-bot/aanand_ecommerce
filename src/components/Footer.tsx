import Link from 'next/link';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import logo from '@/assets/logo.png';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background pt-16 pb-8 border-t-[8px] border-accent">
      <div className="container mx-auto px-6 lg:px-8">
        
        {/* Newsletter Section inside Footer */}
        <div className="max-w-4xl mx-auto text-center mb-16 pb-12 border-b border-background/10">
          <h3 className="font-display text-3xl font-bold mb-4 text-background">Join Our Newsletter</h3>
          <p className="text-background/70 mb-8 max-w-2xl mx-auto">
            Subscribe to receive updates, access to exclusive deals, and more.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="flex-1 px-6 py-3.5 rounded-[18px] bg-background/5 border border-background/20 text-background placeholder:text-background/40 focus:outline-none focus:border-accent transition-colors"
            />
            <button className="px-8 py-3.5 bg-accent text-accent-foreground font-semibold rounded-[18px] hover:bg-accent/90 transition-colors shadow-lg hover:-translate-y-0.5">
              Subscribe
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Logo & About */}
          <div>
            <div className="bg-background/90 p-4 rounded-[18px] inline-block mb-6 shadow-inner">
              <Image src={logo} alt="Morpankh Saree" height={100} width={100} className="object-contain drop-shadow-md" />
            </div>
            <p className="text-background/70 text-sm leading-relaxed mb-6 font-medium italic">
              "परंपरेचा मोरपंखी स्पर्श, सौंदर्याची नवी ओळख"
            </p>
            <p className="text-background/60 text-sm leading-relaxed">
              We are dedicated to bringing you the finest collection of traditional and contemporary sarees, crafted with attention to detail and quality.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-bold mb-6 text-accent">Quick Links</h4>
            <ul className="space-y-4 text-sm font-medium text-background/70">
              <li><Link href="/" className="hover:text-accent transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent/50"></span>Home</Link></li>
              <li><Link href="/products" className="hover:text-accent transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent/50"></span>Shop Sarees</Link></li>
              <li><Link href="/about" className="hover:text-accent transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent/50"></span>About Us</Link></li>
              <li><Link href="/contact" className="hover:text-accent transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent/50"></span>Contact Us</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-display text-lg font-bold mb-6 text-accent">Policies</h4>
            <ul className="space-y-4 text-sm font-medium text-background/70">
              <li><Link href="/privacy-policy" className="hover:text-accent transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent/50"></span>Privacy Policy</Link></li>
              <li><Link href="/refund-policy" className="hover:text-accent transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent/50"></span>Refund Policy</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-accent transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent/50"></span>Shipping Policy</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-accent transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent/50"></span>Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Contact & Find Us */}
          <div>
            <h4 className="font-display text-lg font-bold mb-6 text-accent">Get in Touch</h4>
            <div className="space-y-4 text-sm text-background/70 mb-8">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <span>Chhatrapati shivaji maharaj chauk, Chandan Nagar, Pune, Maharashtra 411014</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-accent shrink-0" />
                <a href="tel:+919096971199" className="hover:text-accent transition-colors">+91 90969 71199</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-accent shrink-0" />
                <a href="mailto:support@morpankh.com" className="hover:text-accent transition-colors">support@morpankh.com</a>
              </div>
            </div>

            <h4 className="font-display text-lg font-bold mb-4 text-accent">Follow Us</h4>
            <div className="flex gap-4">
              <a 
                href="https://www.facebook.com/people/Morpankh-Sarees/100076174158976/?rdid=EdmHbLjUb5E8ruwj&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F189HUoPmQo%2F" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-background/10 text-background hover:bg-accent hover:text-accent-foreground rounded-full transition-all hover:-translate-y-1 shadow-md"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="https://www.instagram.com/morpankhsaree?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw%3D%3D" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-background/10 text-background hover:bg-accent hover:text-accent-foreground rounded-full transition-all hover:-translate-y-1 shadow-md"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="https://www.youtube.com/channel/UCH331lbGaXrlDH4Qua-YA9g" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-background/10 text-background hover:bg-accent hover:text-accent-foreground rounded-full transition-all hover:-translate-y-1 shadow-md"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a 
                href="https://api.whatsapp.com/send/?phone=919096971199&text&type=phone_number&app_absent=0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-background/10 text-background hover:bg-accent hover:text-accent-foreground rounded-full transition-all hover:-translate-y-1 shadow-md overflow-hidden relative"
              >
                <img src="/wp_icon1.png" alt="WhatsApp" className="absolute inset-0 w-full h-full object-cover scale-50" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-background/10 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-background/50 gap-4">
          <div>© {new Date().getFullYear()} Morpankh Saree. All rights reserved.</div>
          <div>
            Designed &amp; Developed by{" "}
            <a
              href="https://www.al-mawa.international/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent/80 font-semibold transition-colors"
            >
              Al-Mawa International
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
