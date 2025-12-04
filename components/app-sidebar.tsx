import { House, Workflow, ClipboardClock, AppWindow, ChevronDown } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import Image from "next/image";

import { Geist } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


const items = [
  {
    title: "Home",
    url: "/",
    icon: House,
  },
  {
    title: "My Workflows",
    url: "#",
    icon: Workflow,
  },
  {
    title: "Integrations",
    url: "/integrations",
    icon: AppWindow,
  },
  {
    title: "Logs",
    url: "#",
    icon: ClipboardClock,
  },
]

export function AppSidebar() {
  return (
    <Sidebar className={`${geistSans.className} border-x-2 border-slate-800/60 bg-slate-950 text-white`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap');
        .font-merriweather {
          font-family: 'Merriweather', serif;
        }
      `}</style>
  <SidebarContent className="flex flex-col h-full">
    <SidebarGroup className="flex flex-col flex-1">
      <SidebarGroupLabel className="flex items-center py-10 font-bold text-xl font-merriweather">
        <Image src="/logo.png" alt="Steamline Logo" width={50} height={50} className="mr-2"/>
        Streamline
      </SidebarGroupLabel>
      
      <SidebarGroupContent className="flex-1 flex flex-col justify-center">
        <SidebarMenu className="space-y-2">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url} className="flex items-center py-10">
                  <item.icon/>
                  <span className="text-[16px]">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
      <div className="flex justify-center px-2 pb-4">
        <div className="scale-150">
          <UserButton/>
        </div>
      </div>
    </SidebarGroup>
    
  </SidebarContent>
</Sidebar>
  );
}
