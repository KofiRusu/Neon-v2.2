"use client";

import { useState, useEffect } from "react";
import { api } from "../../utils/trpc";
import {
  CogIcon,
  KeyIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon,
  BoltIcon,
  CloudIcon,
  CommandLineIcon,
  BeakerIcon,
  LockClosedIcon,
  LockOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  StarIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

interface Setting {
  id: string;
  key: string;
  value: any;
  type: string;
  category: string;
  description?: string;
  isSystem: boolean;
  isEncrypted: boolean;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface APIKey {
  id: string;
  name: string;
  service: string;
  keyPreview: string;
  isActive: boolean;
  lastUsed?: Date;
  usageCount: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  description?: string;
  version: string;
  isActive: boolean;
  usage: number;
  rating?: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function SettingsPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<
    "general" | "api-keys" | "prompts" | "account" | "notifications"
  >("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddSetting, setShowAddSetting] = useState(false);
  const [showAddAPIKey, setShowAddAPIKey] = useState(false);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [showSecretKeys, setShowSecretKeys] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    emailUpdates: true,
    agentAlerts: true,
    campaignUpdates: false,
    weeklyReports: true,
    securityAlerts: true,
  });
  const [accountInfo, setAccountInfo] = useState({
    name: "John Doe",
    email: "john@company.com",
    company: "NeonHub Marketing",
    timezone: "UTC-8",
    language: "English",
  });

  // Fetch settings
  const {
    data: settingsData,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = api.settings.getSettings.useQuery({
    category: selectedCategory || undefined,
    includeSystem: true,
    includeEncrypted: false,
  });

  // Fetch API keys
  const {
    data: apiKeysData,
    isLoading: apiKeysLoading,
    refetch: refetchAPIKeys,
  } = api.settings.getAPIKeys.useQuery({
    includeInactive: true,
  });

  // Fetch prompt templates
  const {
    data: promptsData,
    isLoading: promptsLoading,
    refetch: refetchPrompts,
  } = api.settings.getPromptTemplates.useQuery({
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    limit: 100,
  });

  // Fetch system config summary
  const { data: configSummary, isLoading: configLoading } =
    api.settings.getSystemConfig.useQuery();

  const tabs = [
    {
      id: "general",
      name: "General Settings",
      icon: CogIcon,
      description: "System configuration and global settings",
    },
    {
      id: "api-keys",
      name: "API Keys",
      icon: KeyIcon,
      description: "Manage API keys for external services",
    },
    {
      id: "prompts",
      name: "Prompt Templates",
      icon: DocumentTextIcon,
      description: "Custom prompt templates and configurations",
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: BellIcon,
      description: "Configure notification preferences",
    },
    {
      id: "account",
      name: "Account Info",
      icon: UserGroupIcon,
      description: "Personal account information",
    },
  ];

  const settingCategories = [
    { value: "", label: "All Categories" },
    { value: "ai", label: "AI Settings" },
    { value: "api_keys", label: "API Keys" },
    { value: "behavior", label: "Behavior" },
    { value: "performance", label: "Performance" },
    { value: "security", label: "Security" },
    { value: "ui", label: "User Interface" },
    { value: "integration", label: "Integrations" },
    { value: "system", label: "System" },
  ];

  const promptCategories = [
    { value: "", label: "All Categories" },
    { value: "content", label: "Content Generation" },
    { value: "seo", label: "SEO Optimization" },
    { value: "email", label: "Email Marketing" },
    { value: "social", label: "Social Media" },
    { value: "ads", label: "Advertisements" },
    { value: "support", label: "Customer Support" },
    { value: "analysis", label: "Analysis" },
    { value: "general", label: "General Purpose" },
  ];

  const getSettingIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      ai: BeakerIcon,
      api_keys: KeyIcon,
      behavior: AdjustmentsHorizontalIcon,
      performance: BoltIcon,
      security: ShieldCheckIcon,
      ui: CogIcon,
      integration: CloudIcon,
      system: CommandLineIcon,
    };
    return iconMap[category] || CogIcon;
  };

  const getSettingTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      STRING: "text-neon-blue",
      NUMBER: "text-neon-green",
      BOOLEAN: "text-neon-purple",
      JSON: "text-neon-pink",
      ARRAY: "text-yellow-400",
      ENCRYPTED: "text-red-400",
    };
    return colorMap[type] || "text-gray-400";
  };

  const formatSettingValue = (
    value: any,
    type: string,
    isEncrypted: boolean,
  ) => {
    if (isEncrypted) return "[ENCRYPTED]";

    if (type === "BOOLEAN") {
      return value ? "true" : "false";
    }

    if (type === "JSON" || type === "ARRAY") {
      return (
        JSON.stringify(value).substring(0, 50) +
        (JSON.stringify(value).length > 50 ? "..." : "")
      );
    }

    return (
      String(value).substring(0, 100) +
      (String(value).length > 100 ? "..." : "")
    );
  };

  const getServiceIcon = (service: string) => {
    // This would map to actual service icons
    return KeyIcon;
  };

  // Handler functions for new settings
  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    // In real implementation, this would save to backend
    console.log("Updated notification setting:", key, value);
  };

  const handleAccountUpdate = (field: string, value: string) => {
    setAccountInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
    // In real implementation, this would save to backend
    console.log("Updated account field:", field, value);
  };

  const renderStarRating = (rating?: number) => {
    if (!rating) return null;

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-600"
            }`}
          />
        ))}
        <span className="text-xs text-secondary ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              <span className="text-neon-green">System</span> Settings
            </h1>
            <p className="text-secondary text-lg">
              Configure global behavior, API keys, and prompt templates
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
              <input
                type="text"
                placeholder="Search settings..."
                className="input-neon pl-10 pr-4 py-2 w-80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-neon-green rounded-xl flex items-center justify-center">
                <CogIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-secondary">Total Settings</div>
                <div className="stat-number">
                  {configSummary?.summary?.totalSettings || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-neon-blue rounded-xl flex items-center justify-center">
                <KeyIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-secondary">Active API Keys</div>
                <div className="stat-number">
                  {configSummary?.summary?.activeAPIKeys || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-neon-purple rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-secondary">Prompt Templates</div>
                <div className="stat-number">
                  {configSummary?.summary?.activeTemplates || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-neon-pink rounded-xl flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-secondary">System Settings</div>
                <div className="stat-number">
                  {configSummary?.summary?.systemSettings || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center space-y-2 py-4 px-6 rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-neon-blue text-white shadow-lg"
                  : "text-secondary hover:text-primary hover:bg-gray-700/50"
              }`}
            >
              <Icon className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium text-sm">{tab.name}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "general" && (
        <div className="space-y-8">
          {/* Category Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-neon"
              >
                {settingCategories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddSetting(true)}
              className="btn-neon"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Setting
            </button>
          </div>

          {/* Settings List */}
          <div className="glass-strong p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">
                Configuration Settings
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSecretKeys(!showSecretKeys)}
                  className={`p-2 rounded-lg transition-colors ${
                    showSecretKeys
                      ? "bg-red-500 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {showSecretKeys ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
                <span className="text-xs text-secondary">
                  Show encrypted values
                </span>
              </div>
            </div>

            {settingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {settingsData?.settings?.map((setting: Setting) => {
                  const Icon = getSettingIcon(setting.category);

                  return (
                    <div key={setting.id} className="glass p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                            <Icon className="h-5 w-5 text-white" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-semibold text-primary">
                                {setting.key}
                              </h4>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${getSettingTypeColor(setting.type)} bg-gray-800`}
                              >
                                {setting.type}
                              </span>
                              {setting.isSystem && (
                                <span className="px-2 py-1 bg-neon-pink/20 text-neon-pink text-xs rounded-full">
                                  System
                                </span>
                              )}
                              {setting.isEncrypted && (
                                <LockClosedIcon className="h-4 w-4 text-red-400" />
                              )}
                            </div>

                            <div className="mt-2">
                              <div className="text-sm text-secondary mb-1">
                                {setting.description ||
                                  "No description provided"}
                              </div>
                              <div className="font-mono text-xs text-primary bg-gray-800 p-2 rounded">
                                {formatSettingValue(
                                  setting.value,
                                  setting.type,
                                  setting.isEncrypted && !showSecretKeys,
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted">
                              <span>Category: {setting.category}</span>
                              <span>
                                Updated:{" "}
                                {new Date(
                                  setting.updatedAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingItem(setting)}
                            className="p-2 text-secondary hover:text-neon-blue"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          {!setting.isSystem && (
                            <button className="p-2 text-secondary hover:text-neon-pink">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "api-keys" && (
        <div className="space-y-8">
          {/* Add API Key Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary">
                API Key Management
              </h2>
              <p className="text-secondary text-sm">
                Securely store and manage API keys for external services
              </p>
            </div>

            <button onClick={() => setShowAddAPIKey(true)} className="btn-neon">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add API Key
            </button>
          </div>

          {/* API Keys List */}
          <div className="glass-strong p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary">
                Stored API Keys
              </h3>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-neon-green" />
                <span className="text-sm text-secondary">
                  All keys encrypted
                </span>
              </div>
            </div>

            {apiKeysLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apiKeysData?.apiKeys?.map((apiKey: APIKey) => {
                  const ServiceIcon = getServiceIcon(apiKey.service);

                  return (
                    <div key={apiKey.id} className="card-neon">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                            <ServiceIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-primary">
                              {apiKey.name}
                            </h4>
                            <p className="text-sm text-secondary">
                              {apiKey.service}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-3 h-3 rounded-full ${apiKey.isActive ? "bg-neon-green" : "bg-gray-500"}`}
                        ></div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-secondary mb-1">
                            API Key
                          </div>
                          <div className="font-mono text-sm bg-gray-800 p-2 rounded">
                            {apiKey.keyPreview}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-secondary">
                          <div>
                            <div>Usage: {apiKey.usageCount}</div>
                            <div>
                              Last used:{" "}
                              {apiKey.lastUsed
                                ? new Date(apiKey.lastUsed).toLocaleDateString()
                                : "Never"}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-secondary hover:text-neon-blue">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-secondary hover:text-neon-pink">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {(!apiKeysData?.apiKeys || apiKeysData.apiKeys.length === 0) &&
              !apiKeysLoading && (
                <div className="text-center py-12">
                  <KeyIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-primary mb-2">
                    No API Keys Configured
                  </h3>
                  <p className="text-secondary mb-6">
                    Add your first API key to enable external service
                    integrations.
                  </p>
                  <button
                    onClick={() => setShowAddAPIKey(true)}
                    className="btn-neon"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add First API Key
                  </button>
                </div>
              )}
          </div>
        </div>
      )}

      {activeTab === "prompts" && (
        <div className="space-y-8">
          {/* Category Filter and Add Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-neon"
              >
                {promptCategories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={() => setShowAddPrompt(true)} className="btn-neon">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Template
            </button>
          </div>

          {/* Prompt Templates */}
          <div className="glass-strong p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">
                Prompt Templates
              </h2>
              <div className="text-sm text-secondary">
                {promptsData?.totalCount || 0} templates
              </div>
            </div>

            {promptsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {promptsData?.templates?.map((template: PromptTemplate) => (
                  <div key={template.id} className="card-neon">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-primary mb-1">
                          {template.name}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-neon-blue/20 text-neon-blue text-xs rounded-full">
                            {template.category}
                          </span>
                          <span className="text-xs text-secondary">
                            v{template.version}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${template.isActive ? "bg-neon-green" : "bg-gray-500"}`}
                        ></div>
                      </div>
                    </div>

                    {template.description && (
                      <p className="text-sm text-secondary mb-4">
                        {template.description}
                      </p>
                    )}

                    <div className="bg-gray-800 p-3 rounded-lg mb-4">
                      <div className="text-xs text-secondary mb-2">
                        Template Preview
                      </div>
                      <div className="font-mono text-sm text-primary line-clamp-3">
                        {template.template}
                      </div>
                    </div>

                    {template.variables.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs text-secondary mb-2">
                          Variables
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((variable) => (
                            <span
                              key={variable}
                              className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded-full"
                            >
                              {variable}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-secondary">
                      <div className="flex items-center space-x-4">
                        <div>Usage: {template.usage}</div>
                        {renderStarRating(template.rating)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingItem(template)}
                          className="p-1 text-secondary hover:text-neon-blue"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-secondary hover:text-neon-pink">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!promptsData?.templates || promptsData.templates.length === 0) &&
              !promptsLoading && (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-primary mb-2">
                    No Prompt Templates
                  </h3>
                  <p className="text-secondary mb-6">
                    Create your first prompt template to standardize AI
                    interactions.
                  </p>
                  <button
                    onClick={() => setShowAddPrompt(true)}
                    className="btn-neon"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create First Template
                  </button>
                </div>
              )}
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="space-y-8">
          <div className="glass-strong p-6 rounded-2xl">
            <h2 className="text-2xl font-bold text-primary mb-6">
              Notification Preferences
            </h2>

            <div className="space-y-6">
              {/* Email Updates */}
              <div className="flex items-center justify-between p-4 glass rounded-xl">
                <div>
                  <h3 className="font-semibold text-primary">Email Updates</h3>
                  <p className="text-sm text-secondary">
                    Receive general updates and announcements
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailUpdates}
                    onChange={(e) =>
                      handleNotificationChange("emailUpdates", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neon-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                </label>
              </div>

              {/* Agent Alerts */}
              <div className="flex items-center justify-between p-4 glass rounded-xl">
                <div>
                  <h3 className="font-semibold text-primary">Agent Alerts</h3>
                  <p className="text-sm text-secondary">
                    Get notified when agents complete tasks or encounter errors
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.agentAlerts}
                    onChange={(e) =>
                      handleNotificationChange("agentAlerts", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neon-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                </label>
              </div>

              {/* Campaign Updates */}
              <div className="flex items-center justify-between p-4 glass rounded-xl">
                <div>
                  <h3 className="font-semibold text-primary">
                    Campaign Updates
                  </h3>
                  <p className="text-sm text-secondary">
                    Receive notifications about campaign performance and status
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.campaignUpdates}
                    onChange={(e) =>
                      handleNotificationChange(
                        "campaignUpdates",
                        e.target.checked,
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neon-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                </label>
              </div>

              {/* Weekly Reports */}
              <div className="flex items-center justify-between p-4 glass rounded-xl">
                <div>
                  <h3 className="font-semibold text-primary">Weekly Reports</h3>
                  <p className="text-sm text-secondary">
                    Get weekly performance summaries and insights
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.weeklyReports}
                    onChange={(e) =>
                      handleNotificationChange(
                        "weeklyReports",
                        e.target.checked,
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neon-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                </label>
              </div>

              {/* Security Alerts */}
              <div className="flex items-center justify-between p-4 glass rounded-xl">
                <div>
                  <h3 className="font-semibold text-primary">
                    Security Alerts
                  </h3>
                  <p className="text-sm text-secondary">
                    Important security notifications and login alerts
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.securityAlerts}
                    onChange={(e) =>
                      handleNotificationChange(
                        "securityAlerts",
                        e.target.checked,
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neon-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-700">
              <button className="btn-neon">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "account" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="glass-strong p-6 rounded-2xl">
              <h2 className="text-2xl font-bold text-primary mb-6">
                Personal Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={accountInfo.name}
                    onChange={(e) =>
                      handleAccountUpdate("name", e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-neon-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={accountInfo.email}
                    onChange={(e) =>
                      handleAccountUpdate("email", e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-neon-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={accountInfo.company}
                    onChange={(e) =>
                      handleAccountUpdate("company", e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-neon-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Timezone
                  </label>
                  <select
                    value={accountInfo.timezone}
                    onChange={(e) =>
                      handleAccountUpdate("timezone", e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-neon-blue"
                  >
                    <option value="UTC-8">Pacific Time (UTC-8)</option>
                    <option value="UTC-5">Eastern Time (UTC-5)</option>
                    <option value="UTC+0">Greenwich Mean Time (UTC+0)</option>
                    <option value="UTC+1">Central European Time (UTC+1)</option>
                    <option value="UTC+8">Singapore Time (UTC+8)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Language
                  </label>
                  <select
                    value={accountInfo.language}
                    onChange={(e) =>
                      handleAccountUpdate("language", e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-primary focus:outline-none focus:border-neon-blue"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="German">Deutsch</option>
                    <option value="Japanese">日本語</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-700">
                <button className="btn-neon">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Update Profile
                </button>
              </div>
            </div>

            {/* Security Settings */}
            <div className="glass-strong p-6 rounded-2xl">
              <h2 className="text-2xl font-bold text-primary mb-6">
                Security Settings
              </h2>

              <div className="space-y-6">
                <div className="glass p-4 rounded-xl border border-gray-600">
                  <h3 className="font-semibold text-primary mb-2">
                    Change Password
                  </h3>
                  <p className="text-sm text-secondary mb-4">
                    Update your account password for security
                  </p>
                  <button className="btn-neon-purple">
                    <LockClosedIcon className="h-4 w-4 mr-2" />
                    Change Password
                  </button>
                </div>

                <div className="glass p-4 rounded-xl border border-gray-600">
                  <h3 className="font-semibold text-primary mb-2">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-secondary mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <button className="btn-neon-green">
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    Enable 2FA
                  </button>
                </div>

                <div className="glass p-4 rounded-xl border border-gray-600">
                  <h3 className="font-semibold text-primary mb-2">
                    Active Sessions
                  </h3>
                  <p className="text-sm text-secondary mb-4">
                    Manage your active login sessions
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-primary">Current Session</span>
                        <span className="text-secondary ml-2">
                          Chrome on macOS
                        </span>
                      </div>
                      <span className="text-neon-green text-xs">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-primary">Mobile App</span>
                        <span className="text-secondary ml-2">iOS 17.2</span>
                      </div>
                      <button className="text-neon-pink text-xs hover:underline">
                        End Session
                      </button>
                    </div>
                  </div>
                </div>

                <div className="glass p-4 rounded-xl border border-gray-600">
                  <h3 className="font-semibold text-primary mb-2">
                    Download Data
                  </h3>
                  <p className="text-sm text-secondary mb-4">
                    Export your account data and settings
                  </p>
                  <button className="btn-neon-blue">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Request Export
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
