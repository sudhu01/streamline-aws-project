'use client'
import { Navbar } from './navbar';
import React,{useState} from 'react'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {AppSidebar} from "@/components/app-sidebar"
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { HomeComponent } from './home';


export const IntegrationsComponent: React.FC = () => {

  return (
      <>
      <SignedOut>
        <HomeComponent />
      </SignedOut>

      <SignedIn>
        <SidebarProvider>
        <AppSidebar/>
        <main className="w-full bg-slate-950 text-white diagonal-bg">
          <SidebarTrigger className="m-4" />
          <div className="min-h-screen bg-slate-950 text-white diagonal-bg">
            <div className="mx-auto flex min-h-screen max-w-350 flex-col border-x-2 border-slate-800/60 bg-slate-950">
              <section className="relative border-slate-800/60 border-b-2 px-4 py-2 sm:px-6 sm:py-2 text-left">
                <h1 className="text-gray-400 text-6xl">This is our integration suite</h1>
                
              </section>
            </div>
          </div>
        </main>
      </SidebarProvider>
      </SignedIn>
      </>
    );
}