import Link from 'next/link';
import { Facebook, Instagram, Youtube, MessageCircle } from 'lucide-react';
import logo from '@/assets/logo.png';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo Section */}
          <div>
            <Image src={logo} alt="Morpankh Saree" height={120} width={120} />
            <p className="text-background/70 text-sm leading-relaxed">
              परंपरेचा मोरपंखी स्पर्श, सौंदर्याची नवी ओळख
            </p>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Policies</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link href="/privacy-policy" className="hover:text-background transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund-policy" className="hover:text-background transition-colors">Refund Policy</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-background transition-colors">Shipping Policy</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-background transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* About Us */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">About Us</h4>
            <p className="text-sm text-background/70 leading-relaxed">
              We are dedicated to bringing you the finest collection of traditional and contemporary sarees, crafted with attention to detail and quality.
            </p>
          </div>

          {/* Find Us + Social */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Find Us</h4>
            <div className="relative w-full h-32 rounded-lg mb-4 overflow-hidden bg-background/10">
              <iframe
                title="Footer Store Location"
                src="https://www.google.com/maps?q=Chhatrapati%20shivaji%20maharaj%20chauk%2C%20Chandan%20Nagar%2C%20Pune%2C%20Maharashtra%20411014&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href="https://www.google.com/maps?q=Chhatrapati%20shivaji%20maharaj%20chauk%2C%20Chandan%20Nagar%2C%20Pune%2C%20Maharashtra%20411014"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-foreground/40 hover:bg-foreground/25 transition-colors"
              >
                <span className="text-background text-xs font-semibold">📍 View on Google Maps</span>
              </a>
            </div>
            <h4 className="font-display text-lg font-semibold mb-3">Follow Us</h4>
            <div className="flex gap-3">
              <a 
                href="https://www.facebook.com/people/Morpankh-Sarees/100076174158976/?rdid=EdmHbLjUb5E8ruwj&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F189HUoPmQo%2F" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-background/10 rounded-full hover:bg-background/20 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="https://www.instagram.com/morpankhsaree?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw%3D%3D" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-background/10 rounded-full hover:bg-background/20 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="https://www.youtube.com/channel/UCH331lbGaXrlDH4Qua-YA9g" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-background/10 rounded-full hover:bg-background/20 transition-colors"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a 
                href="https://api.whatsapp.com/send/?phone=919096971199&text&type=phone_number&app_absent=0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-background/10 rounded-full hover:bg-background/20 transition-colors"
              >
                <img 
                  src="/wp_icon1.png" 
                  alt="WhatsApp" 
                  className="h-4 w-4 rounded-full object-cover"
                />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-8 pt-6 text-center text-sm text-background/50 space-y-1">
          <div>© 2026 Morpankh Saree. All rights reserved.</div>
<div>
  Designed &amp; Developed by{" "}
  <a
    href="https://www.al-mawa.international/"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-background transition-colors"
  >
    Al-Mawa International
  </a>
</div>        </div>
      </div>
    </footer>
  );
};

export default Footer;
