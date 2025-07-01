"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";
import AgentControlPanel from "./AgentControlPanel";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AgentControlWidgetProps } from "./types";

export default function AgentControlWidget({
  className = "",
}: AgentControlWidgetProps) {
  return (
    <Card
      className={`glassmorphism-effect border-white/10 bg-white/5 shadow-lg ${className}`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-lg text-white">Agent Status</CardTitle>
          </div>
          <Link href="/agents">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-white/10 text-xs"
            >
              See all agents
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <AgentControlPanel
          showHeader={false}
          showMetrics={true}
          compact={true}
          className=""
        />
      </CardContent>
    </Card>
  );
}
