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
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  KeyIcon,
  ServerIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { trpc } from "../../utils/trpc";
import PageLayout from "../../components/page-layout";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("platform");
  const [hasChanges, setHasChanges] = useState(false);
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});

  // tRPC queries and mutations
  const {
    data: allSettings,
    isLoading,
    refetch,
  } = trpc.settings.getAll.useQuery();

  const updateSettingMutation = trpc.settings.set.useMutation({
    onSuccess: () => {
      refetch();
      setHasChanges(false);
      setEditingSettings({});
    },
  });

  const initDefaultsMutation = trpc.settings.initDefaults.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const settings = allSettings?.data || [];

  // Group settings by category
  const settingsByCategory = settings.reduce((acc: Record<string, any[]>, setting: any) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, any[]>);

  const handleSettingChange = (key: string, value: string) => {
    setEditingSettings((prev: Record<string, string>) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveSetting = async (setting: any) => {
    const newValue = editingSettings[setting.key] || setting.value;
    await updateSettingMutation.mutateAsync({
      key: setting.key,
      value: newValue,
      category: setting.category,
    });
  };

  const handleInitDefaults = () => {
    initDefaultsMutation.mutate();
  };

  const renderSettingCard = (setting: any) => {
    const isEditing = setting.key in editingSettings;
    const currentValue = isEditing ? editingSettings[setting.key] : setting.value;
    const isReadonly = setting.readonly;

    return (
      <Card key={setting.key} className="relative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">{setting.key}</CardTitle>
              <CardDescription className="text-xs">
                {setting.description || "Platform configuration setting"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isReadonly && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheckIcon className="h-3 w-3" />
                  Protected
                </span>
              )}
              <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">
                {setting.category}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Value</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={currentValue}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                  disabled={isReadonly}
                  className="text-sm"
                  placeholder={isReadonly ? "Managed at environment level" : "Enter value"}
                />
                {!isReadonly && isEditing && (
                  <Button
                    size="sm"
                    onClick={() => handleSaveSetting(setting)}
                    disabled={updateSettingMutation.isLoading}
                  >
                    {updateSettingMutation.isLoading ? "Saving..." : "Save"}
                  </Button>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {new Date(setting.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const categoryIcons = {
    "feature-flags": CogIcon,
    "webhooks": BellIcon,
    "branding": PaintBrushIcon,
    "budget": CurrencyDollarIcon,
    "security": ShieldCheckIcon,
    "integrations": GlobeAltIcon,
  };

  return (
    <PageLayout
      title="Platform Settings"
      subtitle="Configure safe, non-credential platform settings"
      headerActions={
        <div className="flex items-center gap-2">
          {settings.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInitDefaults}
              disabled={initDefaultsMutation.isLoading}
            >
              {initDefaultsMutation.isLoading ? "Initializing..." : "Initialize Defaults"}
            </Button>
          )}
          {hasChanges && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setEditingSettings({});
                setHasChanges(false);
              }}
            >
              Reset Changes
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Security Notice */}
        <Alert>
          <ShieldCheckIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> Critical credentials like API keys, database URLs, and authentication secrets 
            are managed at the environment level for security. Only non-sensitive platform settings can be modified here.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : settings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CogIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Settings Configured</h3>
              <p className="text-gray-500 mb-4">
                Initialize default platform settings to get started.
              </p>
              <Button
                onClick={handleInitDefaults}
                disabled={initDefaultsMutation.isLoading}
              >
                {initDefaultsMutation.isLoading ? "Initializing..." : "Initialize Default Settings"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              {Object.keys(settingsByCategory).map(category => {
                const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || CogIcon;
                return (
                  <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span className="capitalize">{category.replace("-", " ")}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categorySettings.map(renderSettingCard)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Protected Settings Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-green-600" />
              Protected Environment Settings
            </CardTitle>
            <CardDescription>
              These critical settings are managed at the environment level and cannot be changed here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "AUTH_SECRET", description: "Authentication secret for sessions" },
                { key: "OPENAI_API_KEY", description: "OpenAI API key for AI agents" },
                { key: "DATABASE_URL", description: "PostgreSQL connection string" },
                { key: "STRIPE_SECRET_KEY", description: "Stripe payment processing key" },
                { key: "SENDGRID_API_KEY", description: "SendGrid email delivery key" },
                { key: "TWILIO_AUTH_TOKEN", description: "Twilio WhatsApp messaging token" },
              ].map(setting => (
                <div key={setting.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{setting.key}</div>
                    <div className="text-xs text-gray-500">{setting.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                    Protected
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
