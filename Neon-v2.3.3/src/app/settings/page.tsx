"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  KeyIcon,
  ServerIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { trpc } from "../../utils/trpc";
import PageLayout from "../../components/page-layout";

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    openaiApiKey: "",
    databaseUrl: "",
    apiUrl: "",
    debugMode: false,
    maxAgents: 10,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const {
    data: settingsData,
    isLoading,
    refetch,
  } = trpc.settings.getAll.useQuery();
  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      refetch();
      setHasChanges(false);
    },
  });

  const settings = settingsData?.data;

  React.useEffect(() => {
    if (settings) {
      setFormData({
        openaiApiKey: settings.openaiApiKey,
        databaseUrl: settings.databaseUrl,
        apiUrl: settings.apiUrl,
        debugMode: settings.debugMode,
        maxAgents: settings.maxAgents,
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        openaiApiKey: settings.openaiApiKey,
        databaseUrl: settings.databaseUrl,
        apiUrl: settings.apiUrl,
        debugMode: settings.debugMode,
        maxAgents: settings.maxAgents,
      });
      setHasChanges(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.substring(0, 8) + "••••••••••••••••••••••••••••";
  };

  const validateApiKey = (key: string) => {
    return key.startsWith("sk-") && key.length > 20;
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <PageLayout
      title="Settings"
      subtitle="Configure your NeonHub environment and preferences"
      headerActions={
        hasChanges ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateSettingsMutation.isLoading}
            >
              {updateSettingsMutation.isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        ) : null
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="api" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="agents">Agent Settings</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <KeyIcon className="h-5 w-5 text-blue-600" />
                      <CardTitle>OpenAI API Configuration</CardTitle>
                    </div>
                    <CardDescription>
                      Configure your OpenAI API key for AI agent functionality
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="openai-key">API Key</Label>
                      <div className="relative">
                        <Input
                          id="openai-key"
                          type={showApiKey ? "text" : "password"}
                          value={
                            showApiKey
                              ? formData.openaiApiKey
                              : maskApiKey(formData.openaiApiKey)
                          }
                          onChange={(e) =>
                            handleInputChange("openaiApiKey", e.target.value)
                          }
                          placeholder="sk-..."
                          className="pr-10"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        {validateApiKey(formData.openaiApiKey) ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">
                              Valid API key format
                            </span>
                          </>
                        ) : (
                          <>
                            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-600">
                              Invalid API key format
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="api-url">API Base URL</Label>
                      <Input
                        id="api-url"
                        value={formData.apiUrl}
                        onChange={(e) =>
                          handleInputChange("apiUrl", e.target.value)
                        }
                        placeholder="http://localhost:3001"
                      />
                      <div className="flex items-center space-x-2">
                        {validateUrl(formData.apiUrl) ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">
                              Valid URL format
                            </span>
                          </>
                        ) : (
                          <>
                            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-600">
                              Invalid URL format
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <CogIcon className="h-5 w-5 text-purple-600" />
                      <CardTitle>Development Settings</CardTitle>
                    </div>
                    <CardDescription>
                      Configure development and debugging options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="debug-mode">Debug Mode</Label>
                        <p className="text-sm text-gray-500">
                          Enable detailed logging and error reporting
                        </p>
                      </div>
                      <Switch
                        id="debug-mode"
                        checked={formData.debugMode}
                        onCheckedChange={(checked) =>
                          handleInputChange("debugMode", checked)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-agents">
                        Maximum Concurrent Agents
                      </Label>
                      <Input
                        id="max-agents"
                        type="number"
                        min="1"
                        max="50"
                        value={formData.maxAgents}
                        onChange={(e) =>
                          handleInputChange(
                            "maxAgents",
                            parseInt(e.target.value) || 1,
                          )
                        }
                      />
                      <p className="text-sm text-gray-500">
                        Maximum number of agents that can run simultaneously
                      </p>
                    </div>

                    <Alert>
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <AlertDescription>
                        Changes to these settings require an application restart
                        to take effect.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <ServerIcon className="h-5 w-5 text-green-600" />
                    <CardTitle>Database Configuration</CardTitle>
                  </div>
                  <CardDescription>
                    Configure your database connection settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="database-url">Database URL</Label>
                    <Input
                      id="database-url"
                      type="password"
                      value={formData.databaseUrl}
                      onChange={(e) =>
                        handleInputChange("databaseUrl", e.target.value)
                      }
                      placeholder="postgresql://user:password@localhost:5432/neonhub"
                    />
                    <p className="text-sm text-gray-500">
                      PostgreSQL connection string for data persistence
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Database Status
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Connected
                      </Badge>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        Last checked: {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Configuration</CardTitle>
                    <CardDescription>
                      Configure global settings for AI agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Default Agent Timeout</Label>
                      <Input value="300" readOnly />
                      <p className="text-sm text-gray-500">
                        Maximum execution time in seconds
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Retry Attempts</Label>
                      <Input value="3" readOnly />
                      <p className="text-sm text-gray-500">
                        Number of retry attempts for failed tasks
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Rate Limit</Label>
                      <Input value="100" readOnly />
                      <p className="text-sm text-gray-500">
                        API calls per minute per agent
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Agent Types</CardTitle>
                    <CardDescription>
                      Enable or disable specific agent types
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        name: "Content Agent",
                        enabled: true,
                        type: "content-generation",
                      },
                      {
                        name: "SEO Agent",
                        enabled: true,
                        type: "seo-optimization",
                      },
                      {
                        name: "Social Agent",
                        enabled: true,
                        type: "social-media",
                      },
                      {
                        name: "Email Agent",
                        enabled: false,
                        type: "email-marketing",
                      },
                    ].map((agent) => (
                      <div
                        key={agent.type}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-gray-500 capitalize">
                            {agent.type.replace("-", " ")}
                          </div>
                        </div>
                        <Switch checked={agent.enabled} readOnly />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <BellIcon className="h-5 w-5 text-orange-600" />
                    <CardTitle>Notification Preferences</CardTitle>
                  </div>
                  <CardDescription>
                    Configure when and how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Agent Completion Notifications</Label>
                        <p className="text-sm text-gray-500">
                          Get notified when agents complete tasks
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Error Notifications</Label>
                        <p className="text-sm text-gray-500">
                          Get notified when agents encounter errors
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Performance Alerts</Label>
                        <p className="text-sm text-gray-500">
                          Get notified about performance issues
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Daily Summary</Label>
                        <p className="text-sm text-gray-500">
                          Receive daily performance summaries
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-base">Notification Methods</Label>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="rounded"
                          defaultChecked
                        />
                        <span className="text-sm">Email notifications</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Slack integration</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Discord webhooks</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {hasChanges && (
          <Alert>
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Make sure to save your configuration
              before leaving this page.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </PageLayout>
  );
}
