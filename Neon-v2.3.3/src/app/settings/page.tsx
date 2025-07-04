"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  EyeIcon,
  EyeSlashIcon,
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
  RefreshCcwIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/utils/trpc";
import PageLayout from "@/components/page-layout";

// Schema for form validation
const settingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string(),
  category: z.string().min(1, "Category is required"),
});

type SettingFormData = z.infer<typeof settingSchema>;

interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  readonly: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("feature-flags");
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [selectedSetting, setSelectedSetting] = useState<PlatformSetting | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Form setup
  const form = useForm<SettingFormData>({
    resolver: zodResolver(settingSchema),
    defaultValues: {
      key: "",
      value: "",
      category: "feature-flags",
    },
  });

  // tRPC queries and mutations
  const { data: settingsData, isLoading, refetch } = api.settings.getAll.useQuery();
  
  const updateSetting = api.settings.set.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      refetch();
      setIsEditing(false);
      setSelectedSetting(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSetting = api.settings.delete.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      refetch();
      setSelectedSetting(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const initDefaults = api.settings.initDefaults.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const settings = settingsData?.data || [];

  // Group settings by category
  const settingsByCategory = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, PlatformSetting[]>);

  // Handle form submission
  const onSubmit = (data: SettingFormData) => {
    updateSetting.mutate(data);
  };

  // Handle editing existing setting
  const handleEdit = (setting: PlatformSetting) => {
    setSelectedSetting(setting);
    setIsEditing(true);
    form.reset({
      key: setting.key,
      value: setting.value,
      category: setting.category,
    });
  };

  // Handle deleting setting
  const handleDelete = (key: string) => {
    if (confirm("Are you sure you want to delete this setting?")) {
      deleteSetting.mutate({ key });
    }
  };

  // Toggle API key visibility
  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Get category configuration
  const getCategoryConfig = (category: string) => {
    const configs = {
      "feature-flags": {
        icon: CogIcon,
        title: "Feature Flags",
        description: "Enable or disable platform features",
        color: "text-blue-600",
      },
      "webhooks": {
        icon: GlobeAltIcon,
        title: "Webhooks",
        description: "External webhook URLs for notifications",
        color: "text-green-600",
      },
      "branding": {
        icon: PaintBrushIcon,
        title: "Branding",
        description: "Brand colors and visual settings",
        color: "text-purple-600",
      },
      "budget": {
        icon: CurrencyDollarIcon,
        title: "Budget",
        description: "Budget limits and thresholds",
        color: "text-orange-600",
      },
    };
    return configs[category as keyof typeof configs] || {
      icon: ServerIcon,
      title: category,
      description: "Platform settings",
      color: "text-gray-600",
    };
  };

  if (isLoading) {
    return (
      <PageLayout title="Settings" description="Loading settings...">
        <div className="flex items-center justify-center h-64">
          <RefreshCcwIcon className="w-6 h-6 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Settings"
      description="Manage platform settings and configurations"
    >
      <div className="space-y-6">
        {/* Security Warning */}
        <Alert>
          <ShieldCheckIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> Some settings (like API keys and database credentials) are managed securely at the environment level and cannot be changed here. This interface only manages non-sensitive platform settings.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              onClick={() => initDefaults.mutate()}
              disabled={initDefaults.isPending}
              variant="outline"
            >
              <RefreshCcwIcon className="w-4 h-4 mr-2" />
              {initDefaults.isPending ? "Initializing..." : "Initialize Defaults"}
            </Button>
            <Button
              onClick={() => {
                setIsEditing(true);
                setSelectedSetting(null);
                form.reset();
              }}
              variant="default"
            >
              <CogIcon className="w-4 h-4 mr-2" />
              Add Setting
            </Button>
          </div>
          <Badge variant="secondary" className="text-xs">
            {settings.length} settings configured
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings List */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="feature-flags">Features</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="budget">Budget</TabsTrigger>
              </TabsList>

              {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
                <TabsContent key={category} value={category} className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const config = getCategoryConfig(category);
                          const Icon = config.icon;
                          return <Icon className={`w-5 h-5 ${config.color}`} />;
                        })()}
                        <div>
                          <CardTitle>{getCategoryConfig(category).title}</CardTitle>
                          <CardDescription>
                            {getCategoryConfig(category).description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categorySettings.map((setting) => (
                          <motion.div
                            key={setting.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Label className="font-medium">{setting.key}</Label>
                                {setting.readonly && (
                                  <Badge variant="secondary" className="text-xs">
                                    <KeyIcon className="w-3 h-3 mr-1" />
                                    Protected
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                {setting.key.toLowerCase().includes('secret') || 
                                 setting.key.toLowerCase().includes('key') ||
                                 setting.key.toLowerCase().includes('token') ? (
                                  <div className="flex items-center space-x-2">
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      {showApiKey[setting.key] 
                                        ? setting.value 
                                        : "••••••••••••••••"}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleApiKeyVisibility(setting.key)}
                                    >
                                      {showApiKey[setting.key] ? (
                                        <EyeSlashIcon className="w-4 h-4" />
                                      ) : (
                                        <EyeIcon className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                ) : (
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {setting.value}
                                  </code>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(setting)}
                                disabled={setting.readonly}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(setting.key)}
                                disabled={setting.readonly}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                        {categorySettings.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No settings configured for this category
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Settings Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isEditing ? (selectedSetting ? "Edit Setting" : "Add Setting") : "Setting Details"}
                </CardTitle>
                <CardDescription>
                  {isEditing ? "Configure platform setting" : "Select a setting to view details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="key">Key</Label>
                      <Input
                        id="key"
                        {...form.register("key")}
                        placeholder="SETTING_KEY"
                        disabled={!!selectedSetting}
                      />
                      {form.formState.errors.key && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.key.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="value">Value</Label>
                      <Textarea
                        id="value"
                        {...form.register("value")}
                        placeholder="Setting value"
                        rows={3}
                      />
                      {form.formState.errors.value && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.value.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        {...form.register("category")}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="feature-flags">Feature Flags</option>
                        <option value="webhooks">Webhooks</option>
                        <option value="branding">Branding</option>
                        <option value="budget">Budget</option>
                      </select>
                      {form.formState.errors.category && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.category.message}
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        disabled={updateSetting.isPending}
                        className="flex-1"
                      >
                        {updateSetting.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setSelectedSetting(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CogIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Select a setting to view details or click "Add Setting" to create a new one.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
