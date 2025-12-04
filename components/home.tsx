'use client'
import { Navbar } from './navbar';
import React from 'react'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {AppSidebar} from "@/components/app-sidebar"
import { SignedIn, SignedOut } from '@clerk/nextjs';

export const HomeComponent: React.FC = () => {

  return (
    <>
    <SignedOut>

    <Navbar />
      <div className="min-h-screen bg-slate-950 text-white diagonal-bg">
        <div className="mx-auto flex min-h-screen max-w-350 flex-col border-x-2 border-slate-800/60 bg-slate-950">
          <section className="relative border-slate-800/60 border-b-2 px-4 py-2 sm:px-6 sm:py-2 text-left">
            <h1 className="text-gray-400 text-6xl">Making workflow automation easy and accessible to non-technical folks.</h1>
          </section>
        </div>
      </div>
      </SignedOut>


      <SignedIn>
        <SidebarProvider>
        <AppSidebar />
        <main className="w-full bg-slate-950 text-white diagonal-bg">
          <SidebarTrigger className="m-4" />
          <div className="min-h-screen bg-slate-950 text-white diagonal-bg">
            <div className="mx-auto flex min-h-screen max-w-350 flex-col border-x-2 border-slate-800/60 bg-slate-950">
              <section className="relative border-slate-800/60 border-b-2 px-4 py-2 sm:px-6 sm:py-2 text-left">
                <h1 className="text-gray-400 text-6xl">Welcome!</h1>
              </section>
            </div>
          </div>
        </main>
      </SidebarProvider>
      </SignedIn>

    </>
  );
}