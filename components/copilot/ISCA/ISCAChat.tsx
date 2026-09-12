"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useCopilotChat, useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/stores/user";
import { getUserSupplyChains, getNewsRoomInfo } from "@/lib/api/supply-chain";
import { getNotifications } from "@/lib/api/notifications";
import { toast } from "sonner";
import { ISCAChatWindow } from '@/components/copilot/ISCA/ISCAChatWindow';
import { ISCAChatToggle } from '@/components/copilot/ISCA/ISCAChatToggle';

interface UserData {
  id: string;
  email: string;
  organisation_name?: string;
  location?: string;
  industry?: string;
  sub_industry?: string;
  description?: string;
}

interface SupplyChainSummary {
  supply_chain_id: string;
  name: string;
  description?: string;
  industry?: string;
  nodeCount: number;
  edgeCount: number;
  avgRiskScore: number;
  lastModified: string;
}

interface SupplyChainData {
  supply_chain_id: string;
  name: string;
  description?: string;
  form_data?: {
    industry?: string;
    [key: string]: any;
  };
  organisation?: {
    industry?: string;
    [key: string]: any;
  };
  nodes?: any[];
  edges?: any[];
  timestamp?: string;
}

interface NavigationPage {
  name: string;
  path: string;
  description: string;
}

export function ISCAChat() {
  const router = useRouter();
  const pathname = usePathname();
  const { userData, userLoading } = useUser();
  const [supplyChains, setSupplyChains] = useState<SupplyChainSummary[]>([]);
  const [loadingSupplyChains, setLoadingSupplyChains] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [newsRoomData, setNewsRoomData] = useState<any>(null);
  const [loadingNewsRoom, setLoadingNewsRoom] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [navigationStarted, setNavigationStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if CopilotKit is enabled
  const copilotKitEnabled = process.env.NEXT_PUBLIC_COPILOTKIT_ENABLED !== 'false';
  
  // If CopilotKit is not enabled, don't render anything
  if (!copilotKitEnabled) {
    return null;
  }

  // Available navigation pages
  const navigationPages: NavigationPage[] = [
    {
      name: "Dashboard",
      path: "/dashboard",
      description: "Main dashboard with overview of all activities and metrics"
    },
    {
      name: "Digital Twin",
      path: "/digital-twin",
      description: "Manage and create supply chain digital twins"
    },
    {
      name: "Simulation",
      path: "/simulation",
      description: "Run supply chain simulations and scenarios"
    },
    {
      name: "News Room",
      path: "/news-room",
      description: "Latest news and updates related to supply chain"
    },
    {
      name: "Profile",
      path: "/profile",
      description: "User profile and account settings"
    }
  ];

  // Use CopilotKit chat with strict persona enforcement
  const {
    visibleMessages,
    isLoading: isChatLoading,
    appendMessage,
  } = useCopilotChat({
    makeSystemMessage: (contextString, additionalInstructions) => `
      You are SupplyChain AI, an elite, highly professional supply chain operations and digital twin assistant.
      Your sole purpose is to analyze supply chains, optimize logistics, identify risks, and simulate disruptions.

      STRICT BOUNDARIES:
      1. You must ONLY answer questions related to supply chains, logistics, manufacturing, operations, or the Digital Twin canvas you are analyzing.
      2. If the user asks ANY question outside of this scope (including coding, math riddles, general trivia, writing essays, or playing games), you MUST refuse.
      3. Do NOT attempt to answer the out-of-scope question. Reply exactly with: "I am a specialized supply chain operations assistant. I cannot assist with requests outside of supply chain management, logistics, and digital twin analysis."
      4. Never identify yourself as a general-purpose AI or an LLM trained by Google. You are SupplyChain AI.

      Context:
      ${contextString}

      Additional Instructions:
      ${additionalInstructions || ''}
    `
  });

  // Filter out empty or blank messages - check for both content and text properties
  const messages = (visibleMessages || []).filter(message => {
    const content = (message as any).content || (message as any).text || '';
    return content && typeof content === 'string' && content.trim().length > 0;
  });

  // Fetch supply chains when user data is available
  useEffect(() => {
    const fetchSupplyChains = async () => {
      if (!userData?.id || userLoading) return;

      setLoadingSupplyChains(true);
      try {
        const response = await getUserSupplyChains(userData.id);
        
        if (response.status === 'success' && response.data) {
          // Transform supply chain data for the assistant
          const summaries: SupplyChainSummary[] = response.data.map((chain: SupplyChainData) => ({
            supply_chain_id: chain.supply_chain_id,
            name: chain.name || 'Unnamed Supply Chain',
            description: chain.description,
            industry: chain.form_data?.industry || chain.organisation?.industry,
            nodeCount: Array.isArray(chain.nodes) ? chain.nodes.length : 0,
            edgeCount: Array.isArray(chain.edges) ? chain.edges.length : 0,
            avgRiskScore: Array.isArray(chain.nodes) && chain.nodes.length > 0 
              ? chain.nodes.reduce((sum: number, node: any) => sum + (node.data?.riskScore || 0), 0) / chain.nodes.length 
              : 0,
            lastModified: chain.timestamp || new Date().toISOString()
          }));

          setSupplyChains(summaries);
        }
      } catch (error) {
        console.error('Error fetching supply chains for assistant:', error);
      } finally {
        setLoadingSupplyChains(false);
      }
    };

    const fetchNotifications = async () => {
      if (!userData?.id || userLoading) return;

      setLoadingNotifications(true);
      try {
        const response = await getNotifications(userData.id);
        setNotifications(response || []);
      } catch (error) {
        console.error('Error fetching notifications for assistant:', error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    const fetchNewsRoomData = async () => {
      if (!userData?.id || userLoading) return;

      setLoadingNewsRoom(true);
      try {
        const response = await getNewsRoomInfo(userData.id);
        setNewsRoomData(response || null);
      } catch (error) {
        console.error('Error fetching news room data for assistant:', error);
      } finally {
        setLoadingNewsRoom(false);
      }
    };

    fetchSupplyChains();
    fetchNotifications();
    fetchNewsRoomData();
  }, [userData, userLoading]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Provide user data context
  useCopilotReadable({
    description: "Current user profile and organization information",
    value: userData ? {
      user: {
        id: userData.id,
        email: userData.email,
        isAuthenticated: true,
        organisationName: userData.organisation_name,
        location: userData.location,
        industry: userData.industry,
        subIndustry: userData.sub_industry,
        description: userData.description
      },
      currentPage: {
        path: pathname,
        pageName: getPageNameFromPath(pathname)
      }
    } : {
      user: {
        isAuthenticated: false
      },
      currentPage: {
        path: pathname,
        pageName: getPageNameFromPath(pathname)
      }
    }
  });

  // Provide supply chain data context
  useCopilotReadable({
    description: "User's supply chain digital twins and basic information",
    value: {
      supplyChains: supplyChains,
      totalSupplyChains: supplyChains.length,
      industries: [...new Set(supplyChains.map(sc => sc.industry).filter(Boolean))],
      averageComplexity: supplyChains.length > 0 
        ? supplyChains.reduce((sum, sc) => sum + sc.nodeCount, 0) / supplyChains.length 
        : 0,
      averageRiskScore: supplyChains.length > 0
        ? supplyChains.reduce((sum, sc) => sum + sc.avgRiskScore, 0) / supplyChains.length
        : 0,
      loading: loadingSupplyChains
    }
  });

  // Provide notifications context
  useCopilotReadable({
    description: "User's notifications and alerts from the system",
    value: {
      notifications: notifications,
      totalNotifications: notifications.length,
      unreadNotifications: notifications.filter((n: any) => !n.read).length,
      loading: loadingNotifications
    }
  });

  // Provide news room context
  useCopilotReadable({
    description: "News room data with supply chain timeline events and critical alerts",
    value: {
      newsRoomData: newsRoomData,
      hasNewsData: !!newsRoomData,
      loading: loadingNewsRoom
    }
  });

  // Provide navigation context
  useCopilotReadable({
    description: "Available pages and navigation options in the application",
    value: {
      availablePages: navigationPages,
      currentPath: pathname,
      canNavigate: true
    }
  });

  // Navigation action
  useCopilotAction({
    name: "navigateToPage",
    description: "Navigate to a specific page in the application. Use this when the user wants to go to a different section.",
    parameters: [
      {
        name: "pagePath",
        type: "string",
        description: "The path to navigate to (e.g., '/dashboard', '/digital-twin', '/simulation', '/profile')",
        required: true
      }
    ],
    handler: ({ pagePath }) => {
      try {
        // Check if navigation is already in progress
        if (navigationStarted) {
          return `Navigation is already in progress. Please wait.`;
        }

        const validPage = navigationPages.find(page => 
          page.path === pagePath || page.name.toLowerCase() === pagePath.toLowerCase()
        );

        const targetPath = validPage ? validPage.path : pagePath;
        
        // Check if already on the target page
        if (pathname === targetPath) {
          return `You are already on the ${validPage ? validPage.name : targetPath} page.`;
        }

        if (validPage) {
          setNavigationStarted(true);
          router.push(validPage.path);
          toast.success(`Navigating to ${validPage.name}`);
          
          // Reset navigation state after a short delay
          setTimeout(() => {
            setNavigationStarted(false);
          }, 2000);
          
          return `Successfully navigating to ${validPage.name} (${validPage.path})`;
        } else {
          if (pagePath.startsWith('/')) {
            setNavigationStarted(true);
            router.push(pagePath);
            toast.success(`Navigating to ${pagePath}`);
            
            // Reset navigation state after a short delay
            setTimeout(() => {
              setNavigationStarted(false);
            }, 2000);
            
            return `Successfully navigating to ${pagePath}`;
          } else {
            toast.error(`Invalid page path: ${pagePath}`);
            return `Error: Invalid page path "${pagePath}". Available pages: ${navigationPages.map(p => p.path).join(', ')}`;
          }
        }
      } catch (error) {
        console.error('Navigation error:', error);
        toast.error('Navigation failed');
        setNavigationStarted(false); // Reset on error
        return `Error: Failed to navigate to ${pagePath}`;
      }
    }
  });

  // Supply chain navigation action
  useCopilotAction({
    name: "openSupplyChain",
    description: "Open a specific supply chain for viewing. Navigates directly to the supply chain view page.",
    parameters: [
      {
        name: "supplyChainId",
        type: "string", 
        description: "The ID of the supply chain to open",
        required: true
      }
    ],
    handler: ({ supplyChainId }) => {
      try {
        // Check if navigation is already in progress
        if (navigationStarted) {
          return `Navigation is already in progress. Please wait.`;
        }

        // Validate ID is provided
        if (!supplyChainId || supplyChainId.trim().length === 0) {
          return `Error: Please provide a valid supply chain ID.`;
        }

        // Construct the view URL directly with the ID
        const targetPath = `/digital-twin/view/${supplyChainId.trim()}`;
        
        // Check if already on the target page
        if (pathname === targetPath) {
          return `You are already viewing supply chain with ID "${supplyChainId}".`;
        }
        
        // Navigate to the supply chain view page
        setNavigationStarted(true);
        router.push(targetPath);
        toast.success(`Opening supply chain`);
        
        // Reset navigation state after a short delay
        setTimeout(() => {
          setNavigationStarted(false);
        }, 2000);
        
        return `Successfully opening supply chain with ID "${supplyChainId}"`;
        
      } catch (error) {
        console.error('Error opening supply chain:', error);
        toast.error('Failed to open supply chain');
        setNavigationStarted(false); // Reset on error
        return `Error: Failed to open supply chain with ID "${supplyChainId}"`;
      }
    }
  });

  // Get notifications action
  useCopilotAction({
    name: "getNotifications",
    description: "Fetch and display user notifications and alerts",
    parameters: [],
    handler: async () => {
      try {
        if (!userData?.id) {
          return "Error: User not authenticated";
        }

        setLoadingNotifications(true);
        const response = await getNotifications(userData.id);
        setNotifications(response || []);
        
        const unreadCount = (response || []).filter((n: any) => !n.read).length;
        
        return `Successfully fetched ${response?.length || 0} notifications. ${unreadCount} unread notifications.`;
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return "Error: Failed to fetch notifications";
      } finally {
        setLoadingNotifications(false);
      }
    }
  });

  // Get news room info action
  useCopilotAction({
    name: "getNewsRoomInfo",
    description: "Fetch news room data with supply chain timeline events and critical alerts",
    parameters: [],
    handler: async () => {
      try {
        if (!userData?.id) {
          return "Error: User not authenticated";
        }

        setLoadingNewsRoom(true);
        const response = await getNewsRoomInfo(userData.id);
        setNewsRoomData(response || null);
        
        // Count total events across all supply chains
        let totalEvents = 0;
        if (response) {
          Object.values(response).forEach((chainArray: any) => {
            if (Array.isArray(chainArray)) {
              chainArray.forEach((batch: any) => {
                if (batch.nodes) {
                  batch.nodes.forEach((node: any) => {
                    if (node.criticalEvents) {
                      totalEvents += node.criticalEvents.length;
                    }
                  });
                }
              });
            }
          });
        }
        
        return `Successfully fetched news room data. Found ${totalEvents} critical events across ${Object.keys(response || {}).length} supply chains.`;
      } catch (error) {
        console.error('Error fetching news room data:', error);
        return "Error: Failed to fetch news room data";
      } finally {
        setLoadingNewsRoom(false);
      }
    }
  });

  // Get user insights action
  useCopilotAction({
    name: "getUserInsights",
    description: "Get insights about the user's supply chain portfolio and activities",
    parameters: [],
    handler: () => {
      const insights = {
        totalSupplyChains: supplyChains.length,
        industries: [...new Set(supplyChains.map(sc => sc.industry).filter(Boolean))],
        complexityAnalysis: {
          simple: supplyChains.filter(sc => sc.nodeCount < 5).length,
          moderate: supplyChains.filter(sc => sc.nodeCount >= 5 && sc.nodeCount < 15).length,
          complex: supplyChains.filter(sc => sc.nodeCount >= 15).length
        },
        riskAnalysis: {
          lowRisk: supplyChains.filter(sc => sc.avgRiskScore < 0.3).length,
          mediumRisk: supplyChains.filter(sc => sc.avgRiskScore >= 0.3 && sc.avgRiskScore < 0.7).length,
          highRisk: supplyChains.filter(sc => sc.avgRiskScore >= 0.7).length
        },
        recentActivity: supplyChains
          .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
          .slice(0, 3)
          .map(sc => ({ name: sc.name, lastModified: sc.lastModified }))
      };

      return `User Portfolio Insights:
- Total Supply Chains: ${insights.totalSupplyChains}
- Industries: ${insights.industries.join(', ') || 'Not specified'}
- Complexity: ${insights.complexityAnalysis.simple} simple, ${insights.complexityAnalysis.moderate} moderate, ${insights.complexityAnalysis.complex} complex
- Risk Profile: ${insights.riskAnalysis.lowRisk} low risk, ${insights.riskAnalysis.mediumRisk} medium risk, ${insights.riskAnalysis.highRisk} high risk
- Recent Activity: ${insights.recentActivity.map(sc => sc.name).join(', ') || 'No recent activity'}`;
    }
  });

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    
    // Prevent sending blank or empty messages
    if (!trimmedInput || trimmedInput.length === 0 || isChatLoading) {
      return;
    }

    const userMessage = trimmedInput;
    setInput('');

    await appendMessage(new TextMessage({
      content: userMessage,
      role: Role.User
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Only send if there's actual content
      if (input.trim().length > 0) {
        handleSendMessage();
      }
    }
  };

  // Don't show chat on Digital Twin pages
  if (pathname.startsWith('/digital-twin')) {
    return null;
  }
  
  return (
    <>
      <ISCAChatToggle 
        isOpen={isOpen} 
        onClick={() => setIsOpen(!isOpen)} 
        hasUnreadMessages={false}
      />
      
      <ISCAChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        input={input}
        setInput={setInput}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
        isLoading={isChatLoading}
        messagesEndRef={messagesEndRef}
        userName={userData?.organisation_name || userData?.email || 'User'}
      />
    </>
  );
}

// Helper function to get readable page name from path
function getPageNameFromPath(pathname: string): string {
  const pathSegments = pathname.split('/').filter(Boolean);
  
  if (pathSegments.length === 0) return "Home";
  
  const mainSegment = pathSegments[0];
  
  switch (mainSegment) {
    case 'dashboard':
      return "Dashboard";
    case 'digital-twin':
      if (pathSegments[1] === 'view') {
        return "Supply Chain View";
      }
      return "Digital Twin";
    case 'simulation':
      if (pathSegments[1] === 'result') {
        return "Simulation Results";
      } else if (pathSegments[1] === 'mitigationstrategy') {
        return "Mitigation Strategy";
      }
      return "Simulation";
    case 'profile':
      return "Profile";
    default:
      return mainSegment.charAt(0).toUpperCase() + mainSegment.slice(1);
  }
}
