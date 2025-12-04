'use client'
import { Navbar } from './navbar';
import React,{useState} from 'react'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {AppSidebar} from "@/components/app-sidebar"
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { HomeComponent } from './home';
import IntegrationList from './ui/integrations';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'],  weight: ['400', '700'] });

export const IntegrationsComponent: React.FC = () => {

  return (
      <>
      <SignedOut>
        <HomeComponent />
      </SignedOut>

      <SignedIn>
        <SidebarProvider>
        <AppSidebar/>
        <main className="w-full bg-slate-950 text-white diagonal-bg text-center flex flex-col">
          <SidebarTrigger className="m-4" />
          <h1 className={`mb-4 mt-8 ml-6 text-3xl font-bold text-white ${inter.className}`}>Integrations</h1>
          <div className="min-h-screen bg-slate-950 text-white diagonal-bg">
            <div className="mx-auto flex min-h-screen max-w-350 flex-col bg-slate-950 diagonal-bg">
              <section className="relative sm:px-6 sm:py-2" />                
              <IntegrationList />
            </div>
          </div>
        </main>
      </SidebarProvider>
      </SignedIn>
      </>
    );
}