"use client";

import React, { useState, type FC, type SVGProps } from "react";
import { Inter } from "next/font/google";

// Icon Imports
import { 
  Gemini, OpenAI, Ollama, HuggingFace, OpenRouter, Claude, 
  Perplexity, ElevenLabs, Stability, LangChain, Runway, GithubCopilot 
} from "@lobehub/icons";

import { 
  IconBrandX, IconBrandReddit, IconBrandLinkedin, IconBrandPinterest, 
  IconBrandDiscord, IconBrandSlack, IconBrandTelegram, IconBrandGmail, 
  IconBrandTwilio, IconBrandGoogleDrive, IconBrandDropbox, IconBrandOnedrive 
} from "@tabler/icons-react";

import type { TablerIcon } from "@tabler/icons-react";

// Component Imports
import StatusToggle from "./StatusToggle";

// Font Setup
const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700"] });

// Types
type IconType = FC<SVGProps<SVGSVGElement>>;

// --- Configuration & Types ---

type FieldType = 'text' | 'password' | 'select' | 'textarea';

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[]; // For 'select' type
  helperText?: string;
}

// Default fallback if an integration isn't explicitly defined
const DEFAULT_FIELDS: FormField[] = [
  { id: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...' }
];

const INTEGRATION_FIELDS: Record<string, FormField[]> = {
  // --- AI Providers ---
  "ChatGPT": [
    { id: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...' },
    { id: 'orgId', label: 'Organization ID (Optional)', type: 'text', placeholder: 'org-...' },
    { id: 'model', label: 'Default Model', type: 'select', options: ['gpt-5.1', 'gpt-5', 'gpt-5 mini', 'gpt-5 nano', 'gpt-5 pro', 'sora 2', 'sora 2 pro', 'o3-deep-research'] },
  ],
  "Claude": [
    { id: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...' },
    { id: 'model', label: 'Model Version', type: 'select', options: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  ],
  "Gemini": [
    { id: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...' },
    { id: 'projectId', label: 'Google Cloud Project ID', type: 'text' },
    { id: 'region', label: 'Region', type: 'select', options: ['us-central1', 'europe-west1', 'asia-east1'] },
  ],
  "ElevenLabs": [
    { id: 'apiKey', label: 'API Key', type: 'password' },
    { id: 'voiceId', label: 'Voice ID', type: 'text', placeholder: '21m00Tcm4TlvDq8ikWAM' },
  ],
  "HuggingFace": [
    { id: 'accessToken', label: 'HF Access Token', type: 'password', placeholder: 'hf_...' },
    { id: 'endpoint', label: 'Inference Endpoint URL', type: 'text', placeholder: 'https://api-inference.huggingface.co/models/...' },
  ],
  "Ollama": [
    { id: 'hostUrl', label: 'Host URL', type: 'text', placeholder: 'http://localhost:11434' },
    { id: 'model', label: 'Model Name', type: 'text', placeholder: 'llama3:latest' },
  ],
  
  // --- Cloud Storage ---
  "Dropbox": [
    { id: 'clientId', label: 'App Key (Client ID)', type: 'text' },
    { id: 'clientSecret', label: 'App Secret', type: 'password' },
    { id: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://your-domain.com/webhooks/dropbox', helperText: 'Set this in your Dropbox App Console' },
  ],
  "Google Drive": [
    { id: 'clientId', label: 'Client ID', type: 'text' },
    { id: 'clientSecret', label: 'Client Secret', type: 'password' },
    { id: 'serviceAccount', label: 'Service Account JSON (Server-to-Server)', type: 'textarea', placeholder: '{ "type": "service_account", ... }' },
  ],
  "OneDrive": [
    { id: 'clientId', label: 'Client ID', type: 'text' },
    { id: 'clientSecret', label: 'Client Secret', type: 'password' },
    { id: 'tenantId', label: 'Tenant ID', type: 'text' },
  ],

  // --- Email & SMS ---
  "Gmail": [
    { id: 'clientId', label: 'OAuth Client ID', type: 'text' },
    { id: 'clientSecret', label: 'OAuth Client Secret', type: 'password' },
    { id: 'redirectUri', label: 'Redirect URI', type: 'text', helperText: 'Must match Google Cloud Console settings' },
  ],
  "Twilio": [
    { id: 'accountSid', label: 'Account SID', type: 'text' },
    { id: 'authToken', label: 'Auth Token', type: 'password' },
    { id: 'phoneNumber', label: 'Twilio Phone Number', type: 'text', placeholder: '+15550000000' },
  ],

  // --- Social Media ---
  "Discord": [
    { id: 'botToken', label: 'Bot Token', type: 'password' },
    { id: 'webhookUrl', label: 'Webhook URL (Optional)', type: 'text', helperText: 'For sending messages to a specific channel' },
  ],
  "Slack": [
    { id: 'clientId', label: 'Client ID', type: 'text' },
    { id: 'clientSecret', label: 'Client Secret', type: 'password' },
    { id: 'signingSecret', label: 'Signing Secret', type: 'password', helperText: 'Used to verify incoming webhook requests' },
    { id: 'botToken', label: 'Bot User OAuth Token', type: 'password', placeholder: 'xoxb-...' },
  ],
  "Twitter": [
    { id: 'apiKey', label: 'API Key', type: 'text' },
    { id: 'apiSecret', label: 'API Secret', type: 'password' },
    { id: 'bearerToken', label: 'Bearer Token (v2)', type: 'password' },
  ],
  "LinkedIn": [
    { id: 'clientId', label: 'Client ID', type: 'text' },
    { id: 'clientSecret', label: 'Client Secret', type: 'password' },
    { id: 'orgId', label: 'Organization ID', type: 'text', helperText: 'Required for posting to Company Pages' },
  ],
  "Telegram": [
    { id: 'botToken', label: 'Bot Token', type: 'password', placeholder: '123456:ABC-...' },
    { id: 'chatId', label: 'Default Chat ID', type: 'text' },
  ]
};

// --- 1. The Modal Component ---
function IntegrationModal({
  isOpen,
  onClose,
  name,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
}) {
  if (!isOpen) return null;

  // Get fields for this specific integration, or fallback to default
  const fields = INTEGRATION_FIELDS[name] || DEFAULT_FIELDS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all duration-300 p-4">
      {/* Modal Container */}
      <div className="relative w-full max-w-lg scale-100 transform flex flex-col max-h-[90vh] rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl transition-all">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
          <div>
            <h3 className={`text-xl font-semibold text-white ${inter.className}`}>Configure {name}</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Enter credentials to enable {name} services.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form 
            id="integration-form"
            className="flex flex-col gap-5" 
            onSubmit={(e) => { 
              e.preventDefault(); 
              // Handle form data here
              const formData = new FormData(e.currentTarget);
              console.log(Object.fromEntries(formData));
              onClose(); 
            }}
          >
            {fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label 
                  htmlFor={field.id}
                  className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1"
                >
                  {field.label}
                </label>
                
                {field.type === 'select' ? (
                  <div className="relative">
                    <select
                      name={field.id}
                      className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                ) : field.type === 'textarea' ? (
                   <textarea
                    name={field.id}
                    rows={4}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.id}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                )}

                {field.helperText && (
                  <p className="text-xs text-zinc-500 ml-1">{field.helperText}</p>
                )}
              </div>
            ))}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 rounded-b-2xl flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="integration-form" // Connects to the form ID above
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)]"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 2. Main List Component ---
export default function IntegrationList() {
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);

  const handleStatusChange = (newState: 'available' | 'connected') => {
    console.log(`User is now: ${newState}`);
    // API call logic here
  };

  const openModal = (name: string) => {
    setActiveIntegration(name);
  };

  return (
    <section className="items-center justify-center text-center flex flex-col pb-20 pt-10">      
      <StatusToggle onToggle={handleStatusChange} />

      {/* --- AI Section --- */}
      <h2 className={`mb-4 mt-10 ml-6 text-2xl font-bold text-zinc-400 ${inter.className} self-start`}>
        AI
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 p-6 w-full max-w-7xl">
        <AIIntegration name="ChatGPT" icon={OpenAI} borderColor="border-green-900" onClick={() => openModal("ChatGPT")} />
        <AIIntegration name="Claude" icon={Claude.Color} borderColor="border-orange-900" onClick={() => openModal("Claude")} />
        <AIIntegration name="ElevenLabs" icon={ElevenLabs} iconColor="text-gray-200" borderColor="border-gray-200" onClick={() => openModal("ElevenLabs")} />
        <AIIntegration name="Gemini" icon={Gemini.Color} borderColor="border-blue-900" onClick={() => openModal("Gemini")} />
        <AIIntegration name="GitHub Copilot" icon={GithubCopilot} borderColor="border-blue-900" onClick={() => openModal("GitHub Copilot")} />
        <AIIntegration name="HuggingFace" icon={HuggingFace.Color} borderColor="border-yellow-900" onClick={() => openModal("HuggingFace")} />
        <AIIntegration name="LangChain" icon={LangChain.Color} borderColor="border-gray-700" onClick={() => openModal("LangChain")} />
        <AIIntegration name="Ollama" icon={Ollama} borderColor="border-gray-600" onClick={() => openModal("Ollama")} />
        <AIIntegration name="OpenRouter" icon={OpenRouter} borderColor="border-indigo-900" onClick={() => openModal("OpenRouter")} />
        <AIIntegration name="Perplexity" icon={Perplexity.Color} borderColor="border-teal-900" onClick={() => openModal("Perplexity")} />
        <AIIntegration name="Runway" icon={Runway} borderColor="border-zinc-700" onClick={() => openModal("Runway")} />
        <AIIntegration name="Stability AI" icon={Stability.Color} borderColor="border-purple-900" onClick={() => openModal("Stability AI")} />
      </div>

      {/* --- Cloud Storage Section --- */}
      <h2 className={`mb-4 mt-10 ml-6 text-2xl font-bold text-zinc-400 ${inter.className} self-start`}>
        Cloud Storage
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 w-full max-w-4xl">
        <Integration name="Dropbox" icon={IconBrandDropbox} borderColor="border-blue-800" onClick={() => openModal("Dropbox")} />
        <Integration name="Google Drive" icon={IconBrandGoogleDrive} iconColor="text-red-500" borderColor="border-blue-800" onClick={() => openModal("Google Drive")} />
        <Integration name="OneDrive" icon={IconBrandOnedrive} iconColor="text-blue-400" borderColor="border-blue-800" onClick={() => openModal("OneDrive")} />
      </div>

      {/* --- Email Section --- */}
      <h2 className={`mb-4 mt-10 ml-6 text-2xl font-bold text-zinc-400 ${inter.className} self-start`}>
        Email & SMS
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 w-full max-w-2xl">
        <Integration name="Gmail" icon={IconBrandGmail} iconColor="text-red-500" borderColor="border-red-900" onClick={() => openModal("Gmail")} />
        <Integration name="Twilio" icon={IconBrandTwilio} iconColor="text-red-500" borderColor="border-red-900" onClick={() => openModal("Twilio")} />
      </div>

      {/* --- Social Media Section --- */}
      <h2 className={`mb-4 mt-10 ml-6 text-2xl font-bold text-zinc-400 ${inter.className} self-start`}>
        Social Media
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 p-6 mb-10 w-full max-w-7xl">
        <Integration name="Discord" icon={IconBrandDiscord} iconColor="text-indigo-500" borderColor="border-indigo-900" onClick={() => openModal("Discord")} />
        <Integration name="LinkedIn" icon={IconBrandLinkedin} iconColor="text-blue-600" borderColor="border-blue-900" onClick={() => openModal("LinkedIn")} />
        <Integration name="Pinterest" icon={IconBrandPinterest} iconColor="text-red-600" borderColor="border-red-900" onClick={() => openModal("Pinterest")} />
        <Integration name="Reddit" icon={IconBrandReddit} iconColor="text-orange-600" borderColor="border-orange-900" onClick={() => openModal("Reddit")} />
        <Integration name="Slack" icon={IconBrandSlack} iconColor="text-purple-500" borderColor="border-purple-900" onClick={() => openModal("Slack")} />
        <Integration name="Telegram" icon={IconBrandTelegram} iconColor="text-sky-500" borderColor="border-sky-900" onClick={() => openModal("Telegram")} />
        <Integration name="Twitter" icon={IconBrandX} iconColor="text-white" borderColor="border-zinc-600" onClick={() => openModal("Twitter")} />
      </div>

      {/* The Popup Modal */}
      <IntegrationModal 
        isOpen={!!activeIntegration} 
        onClose={() => setActiveIntegration(null)} 
        name={activeIntegration || ''} 
      />
    </section>
  );
}

// --- 3. Sub-Components (Unified Styling) ---

interface IntegrationBaseProps {
  name: string;
  iconColor?: string;
  borderColor?: string;
  onClick: () => void;
}

// For LobeHub Icons (FC<SVGProps>)
function AIIntegration({ name, icon: Icon, iconColor, borderColor, onClick }: IntegrationBaseProps & { icon: IconType }) {
  return (
    <div 
      onClick={onClick}
      className={`${borderColor ?? 'border-zinc-700'} bg-zinc-900/40 hover:bg-zinc-800/80 hover:cursor-pointer border-2 p-4 items-center text-center justify-center rounded-xl flex flex-col hover:scale-105 transition-all duration-200 ease-in-out group`}
    >
      <Icon className={`h-10 w-10 ${iconColor ?? "text-white"} group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all`} />
      <span className={`mt-3 text-white text-sm font-medium ${inter.className}`}>{name}</span>
    </div>
  );
}

// For Tabler Icons (TablerIcon type)
function Integration({ name, icon: Icon, iconColor, borderColor, onClick }: IntegrationBaseProps & { icon: TablerIcon }) {
  return (
    <div 
      onClick={onClick}
      className={`${borderColor ?? 'border-zinc-700'} bg-zinc-900/40 hover:bg-zinc-800/80 hover:cursor-pointer border-2 p-4 items-center text-center justify-center rounded-xl flex flex-col hover:scale-105 transition-all duration-200 ease-in-out group`}
    >
      <Icon className={`h-10 w-10 ${iconColor ?? "text-white"} group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all`} />
      <span className={`mt-3 text-white text-sm font-medium ${inter.className}`}>{name}</span>
    </div>
  );
}