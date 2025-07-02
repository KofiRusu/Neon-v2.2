"use client";

import { api } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Bot,
  BarChart3,
  Zap,
  Users,
  Globe,
  CheckCircle2,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  // Health check to show system status
  const { data: healthData, isLoading: healthLoading } =
    api.health.ping.useQuery();
  const { data: userData } = api.user.getProfile.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <Badge
              variant="secondary"
              className="mb-4 bg-purple-600/20 text-purple-200 border-purple-500/30"
            >
              🚀 Now Live - Production Ready
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              NeonHub AI Marketing Platform
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform your marketing with AI-powered automation, real-time
              analytics, and intelligent campaign management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/campaigns">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg"
                >
                  Launch Campaign <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/analytics">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-purple-500 text-purple-300 hover:bg-purple-500/10 px-8 py-4 text-lg"
                >
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* System Status Indicator */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${healthData ? "bg-green-500" : "bg-yellow-500"} ${healthData ? "" : "animate-pulse"}`}
              ></div>
              <span className="text-gray-300">
                System Status:{" "}
                {healthLoading
                  ? "Checking..."
                  : healthData
                    ? "Operational"
                    : "Loading"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-gray-300">34 Pages Deployed</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-gray-300">Production Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Powerful AI Marketing Tools
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to create, manage, and optimize marketing
              campaigns at scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-purple-500/30 hover:border-purple-500/60 transition-colors">
              <CardHeader>
                <Bot className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">AI-Powered Agents</CardTitle>
                <CardDescription className="text-gray-300">
                  Deploy specialized AI agents for content generation, SEO
                  optimization, and campaign management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/agents">
                  <Button
                    variant="ghost"
                    className="text-purple-400 hover:text-purple-300 p-0"
                  >
                    View Agents <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-purple-500/30 hover:border-purple-500/60 transition-colors">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-green-400 mb-4" />
                <CardTitle className="text-white">
                  Real-time Analytics
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Advanced analytics dashboard with performance tracking and ROI
                  optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/analytics">
                  <Button
                    variant="ghost"
                    className="text-green-400 hover:text-green-300 p-0"
                  >
                    View Analytics <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-purple-500/30 hover:border-purple-500/60 transition-colors">
              <CardHeader>
                <Zap className="h-12 w-12 text-yellow-400 mb-4" />
                <CardTitle className="text-white">
                  Campaign Automation
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Automated campaign creation, A/B testing, and performance
                  optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/campaigns">
                  <Button
                    variant="ghost"
                    className="text-yellow-400 hover:text-yellow-300 p-0"
                  >
                    Create Campaign <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-purple-500/30 hover:border-purple-500/60 transition-colors">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">Customer Insights</CardTitle>
                <CardDescription className="text-gray-300">
                  Deep customer analytics and behavior tracking for better
                  targeting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/customers">
                  <Button
                    variant="ghost"
                    className="text-blue-400 hover:text-blue-300 p-0"
                  >
                    View Customers <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-purple-500/30 hover:border-purple-500/60 transition-colors">
              <CardHeader>
                <Globe className="h-12 w-12 text-emerald-400 mb-4" />
                <CardTitle className="text-white">Multi-Platform</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage campaigns across social media, email, and digital
                  advertising platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/social-media">
                  <Button
                    variant="ghost"
                    className="text-emerald-400 hover:text-emerald-300 p-0"
                  >
                    Social Tools <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-purple-500/30 hover:border-purple-500/60 transition-colors">
              <CardHeader>
                <Star className="h-12 w-12 text-orange-400 mb-4" />
                <CardTitle className="text-white">AI Copilot</CardTitle>
                <CardDescription className="text-gray-300">
                  Intelligent marketing assistant for strategy, content, and
                  optimization guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/copilot">
                  <Button
                    variant="ghost"
                    className="text-orange-400 hover:text-orange-300 p-0"
                  >
                    Launch Copilot <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">
                34+
              </div>
              <div className="text-gray-300">Active Pages</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">
                101KB
              </div>
              <div className="text-gray-300">Core Bundle</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">
                20+
              </div>
              <div className="text-gray-300">AI Agents</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-2">
                100%
              </div>
              <div className="text-gray-300">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the AI marketing revolution and scale your campaigns with
            intelligent automation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/campaigns">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg"
              >
                Start Free Campaign
              </Button>
            </Link>
            <Link href="/analytics">
              <Button
                variant="outline"
                size="lg"
                className="border-purple-500 text-purple-300 hover:bg-purple-500/10 px-8 py-4 text-lg"
              >
                View Live Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
