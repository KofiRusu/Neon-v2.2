"use client";

import React, { useState } from "react";
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

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold">NeonHub Copilot</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <XMarkIcon className="h-5 w-5" />
          ) : (
            <Bars3Icon className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="flex-1 flex">
        {/* Desktop Three-Panel Layout */}
        <div className="hidden lg:flex flex-1">
          {/* Left Panel - Chat */}
          <div className="w-1/3 border-r flex flex-col">
            <Card className="h-full rounded-none border-0 border-r">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  Chat Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <CopilotChat sessionId={sessionId} />
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Task Planner */}
          <div className="w-1/3 border-r flex flex-col">
            <Card className="h-full rounded-none border-0 border-r">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2">
                  <ListBulletIcon className="h-5 w-5" />
                  Task Planning
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <TaskPlanner sessionId={sessionId} />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Reasoning Tree */}
          <div className="w-1/3 flex flex-col">
            <Card className="h-full rounded-none border-0">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2">
                  <ShareIcon className="h-5 w-5" />
                  Reasoning Tree
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ReasoningTree sessionId={sessionId} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Tabbed Layout */}
        <div className="lg:hidden flex-1 flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <ListBulletIcon className="h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger
                value="reasoning"
                className="flex items-center gap-2"
              >
                <ShareIcon className="h-4 w-4" />
                Tree
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

            <TabsContent value="reasoning" className="flex-1 mt-0">
              <Card className="h-full rounded-none border-0">
                <CardContent className="h-full p-0">
                  <ReasoningTree sessionId={sessionId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
