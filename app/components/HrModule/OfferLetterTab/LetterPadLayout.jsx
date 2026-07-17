'use client';

import React from 'react';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';

const LetterPadLayout = ({ isWithPad, letterPadType, children }) => {
  return (
    <>
      {/* WATERMARK (ONLY WITHOUT IMAGE LETTERPAD) */}
      {!isWithPad && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img
            src="/asset/livik-watermark.png"
            alt="Livik Watermark"
            className="w-[420px] opacity-10"
          />
        </div>
      )}

      {/* BACKGROUND IMAGE FOR WITH-PAD */}
      {isWithPad && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "url('/asset/Background_letter.jpg')",
            backgroundSize: '794px 1123px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'top center',
          }}
        />
      )}

      {/* HEADER SECTION (ONLY FOR WITH-PAD) */}
      {isWithPad && (
        <div className="relative z-10 w-full pt-16 px-16 flex justify-between items-start">
          {letterPadType === 'type1' ? (
            <div className="flex flex-col text-gray-900">
              <h1 className="text-xl font-bold mb-1">Livik Technologies</h1>
              <div className="text-sm leading-snug font-medium">
                <p>HIG A-7, 2nd street, 9th Cross,</p>
                <p>R.M. Colony, Dindigul- 624001</p>
                <p>Tel: +91- 8610470324</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col text-[#003865]">
              <h1 className="text-xl font-bold mb-3">Livik Software Solutions Private Limited</h1>
              <div className="text-sm leading-snug font-bold flex flex-col gap-2">
                <div className="flex items-start gap-2 text-black">
                  <MapPin size={16} className="text-[#00aeef] shrink-0 mt-0.5" />
                  <div>
                    <p>HIG A-7, 2nd street, 9th Cross,</p>
                    <p>R.M. Colony, Dindigul- 624001</p>
                    <p>Tamil Nadu, India</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-black">
                  <Phone size={16} className="text-[#00aeef] shrink-0" />
                  <p>+91 86104 70324</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <img
              src="/asset/livik-logo.png"
              alt="Livik Logo"
              className="w-24 h-auto"
            />
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="relative z-10 flex-grow flex flex-col">
        {children}
      </div>

      {/* FOOTER SECTION (ONLY FOR WITH-PAD) */}
      {isWithPad && (
        <div className="relative z-10 w-full h-10 mt-auto bg-[#004275] text-white flex items-center justify-center text-sm font-medium print:bg-[#004275] print:text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          {letterPadType === 'type1' ? (
            <div className="flex items-center justify-center gap-2">
              <span>www.liviktech.com</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>info@liviktech.com</span>
              </div>
              <div className="w-px h-5 bg-white/50"></div>
              <div className="flex items-center gap-2">
                <Globe size={16} />
                <span>www.liviktech.com</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default LetterPadLayout;
