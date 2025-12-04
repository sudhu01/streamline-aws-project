"use client";

import React, { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { 
  SignInButton,
  SignUpButton,
} from '@clerk/nextjs'
import { Button } from './ui/Loginbutton';


export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap');
        .font-merriweather {
          font-family: 'Merriweather', serif;
        }
      `}</style>
                
      <nav className="border-b-2 border-slate-800/60 bg-slate-950 text-white">
        <div className="px-10">
          <div className="flex h-20 items-center justify-between">
            {/* Left side - Logo and Title */}
            <div className="flex items-center font-mono font-semibold">
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="Steamline Logo"
                  width={50}
                  height={50}
                  className="mr-2"
                />
              </Link>
              <span className="font-merriweather text-xl font-bold">
                Streamline
              </span>
            </div>

            {/* Right side - Login Button and GitHub Icon */}
            <div className="flex items-center gap-12 px-2">
              
                <SignInButton>
                  <Button text='Log in'/>
                </SignInButton>
                <SignUpButton>
                  <Button text='Sign up'/>
                </SignUpButton>
              
              
              
              
              <Link 
                href="https://github.com/sudhu01/streamline" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:text-cyan-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-github">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}