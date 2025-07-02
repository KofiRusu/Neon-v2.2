"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  ChatBubbleLeftRightIcon,
  ListBulletIcon,
  ShareIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import CopilotChat from "./chat";
import TaskPlanner from "./task-planner";
import ReasoningTree from "./tree";

interface CopilotLayoutProps {
  sessionId: string;
  onSessionChange: (sessionId: string) => void;
}

export default function CopilotLayout({
  sessionId,
  onSessionChange: _onSessionChange,
}: CopilotLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Detect screen size for automatic view mode
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setViewMode("mobile");
      } else if (width < 1024) {
        setViewMode("tablet");
      } else {
        setViewMode("desktop");
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts for tab navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveTab("chat");
            break;
          case '2':
            e.preventDefault();
            setActiveTab("tasks");
            break;
          case '3':
            e.preventDefault();
            setActiveTab("reasoning");
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const panels = [
    {
      id: "chat",
      title: "Chat Stream",
      icon: ChatBubbleLeftRightIcon,
      component: CopilotChat,
      description: "Interactive chat with the AI assistant",
      shortcut: "Alt+1"
    },
    {
      id: "tasks", 
      title: "Task Planning",
      icon: ListBulletIcon,
      component: TaskPlanner,
      description: "Step-by-step task breakdown and planning",
      shortcut: "Alt+2"
    },
    {
      id: "reasoning",
      title: "Reasoning Tree",
      icon: ShareIcon,
      component: ReasoningTree,
      description: "Visual representation of AI reasoning process",
      shortcut: "Alt+3"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const panelVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <div className="h-full flex flex-col" role="application" aria-label="NeonHub Copilot Interface">
      {/* Mobile Header */}
      <AnimatePresence>
        {viewMode === "mobile" && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
          >
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              NeonHub Copilot
            </h1>
            <div className="flex items-center gap-2">
              {/* View Mode Selector */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {[
                  { mode: "desktop" as const, icon: Monitor, label: "Desktop view" },
                  { mode: "tablet" as const, icon: Tablet, label: "Tablet view" },
                  { mode: "mobile" as const, icon: Smartphone, label: "Mobile view" }
                ].map(({ mode, icon: Icon, label }) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    aria-label={label}
                    className="p-2"
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? (
                  <XMarkIcon className="h-5 w-5" />
                ) : (
                  <Bars3Icon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Three-Panel Layout */}
        <AnimatePresence mode="wait">
          {viewMode === "desktop" && (
            <motion.div
              key="desktop"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex flex-1"
            >
              {panels.map((panel, index) => {
                const Component = panel.component;
                return (
                  <motion.div
                    key={panel.id}
                    variants={panelVariants}
                    className={`${
                      index === 0 ? "w-1/3" : index === 1 ? "w-1/3" : "w-1/3"
                    } ${index < 2 ? "border-r border-gray-200 dark:border-gray-700" : ""} flex flex-col`}
                  >
                    <Card className="h-full rounded-none border-0 border-r-0 shadow-none">
                      <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <panel.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                            <span>{panel.title}</span>
                          </div>
                          <kbd className="hidden md:inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                            {panel.shortcut}
                          </kbd>
                        </CardTitle>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {panel.description}
                        </p>
                      </CardHeader>
                      <CardContent className="flex-1 p-0 overflow-hidden">
                        <div className="h-full" role="tabpanel" aria-label={panel.description}>
                          <Component sessionId={sessionId} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tablet Two-Panel Layout */}
        <AnimatePresence mode="wait">
          {viewMode === "tablet" && (
            <motion.div
              key="tablet"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex flex-1"
            >
              <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger 
                      value="chat" 
                      className="flex items-center gap-2"
                      aria-label="Chat panel with keyboard shortcut Alt+1"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger 
                      value="tasks" 
                      className="flex items-center gap-2"
                      aria-label="Tasks panel with keyboard shortcut Alt+2"
                    >
                      <ListBulletIcon className="h-4 w-4" />
                      Tasks
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat" className="flex-1 mt-0">
                    <Card className="h-full rounded-none border-0">
                      <CardContent className="h-full p-0">
                        <CopilotChat sessionId={sessionId} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="tasks" className="flex-1 mt-0">
                    <Card className="h-full rounded-none border-0">
                      <CardContent className="h-full p-0">
                        <TaskPlanner sessionId={sessionId} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Panel - Reasoning Tree */}
              <div className="w-1/2 flex flex-col">
                <Card className="h-full rounded-none border-0">
                  <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <CardTitle className="flex items-center gap-2">
                      <ShareIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Reasoning Tree
                      <kbd className="hidden md:inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 ml-auto">
                        Alt+3
                      </kbd>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <ReasoningTree sessionId={sessionId} />
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Tabbed Layout */}
        <AnimatePresence mode="wait">
          {viewMode === "mobile" && (
            <motion.div
              key="mobile"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex-1 flex flex-col"
            >
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col"
              >
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 mx-4 my-2 rounded-lg">
                  {panels.map((panel) => (
                    <TabsTrigger 
                      key={panel.id}
                      value={panel.id} 
                      className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                      aria-label={`${panel.title} panel with keyboard shortcut ${panel.shortcut}`}
                    >
                      <panel.icon className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">{panel.title.split(' ')[0]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {panels.map((panel) => {
                  const Component = panel.component;
                  return (
                    <TabsContent 
                      key={panel.id}
                      value={panel.id} 
                      className="flex-1 mt-0 mx-2 mb-2"
                    >
                      <Card className="h-full rounded-lg border border-gray-200 dark:border-gray-700">
                        <CardContent className="h-full p-0">
                          <Component sessionId={sessionId} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Accessibility Helper Text */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Current view: {viewMode}. Active panel: {activeTab}. 
        Use Alt+1, Alt+2, Alt+3 to navigate between panels on desktop.
      </div>
    </div>
  );
}
