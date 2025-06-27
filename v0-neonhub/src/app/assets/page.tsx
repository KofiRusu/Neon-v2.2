'use client';

import { useState, useEffect } from 'react';
import { api } from '../../utils/trpc';
import {
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TagIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlayIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Asset {
  id: string;
  name: string;
  type: string;
  category?: string;
  description?: string;
  thumbnail?: string;
  tags: string[];
  status: string;
  usage: number;
  rating?: number;
  remixCount: number;
  createdAt: Date;
  updatedAt: Date;
  parent?: {
    id: string;
    name: string;
    type: string;
  } | null;
  versions: {
    id: string;
    name: string;
    version: string;
    createdAt: Date;
  }[];
  approvals: {
    id: string;
    status: string;
    comment?: string;
    createdAt: Date;
  }[];
  _count: {
    versions: number;
    approvals: number;
  };
}

export default function AssetsPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch assets
  const {
    data: assetsData,
    isLoading: assetsLoading,
    refetch: refetchAssets,
  } = api.assets.getAssets.useQuery({
    type: selectedType || undefined,
    status: selectedStatus || undefined,
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    limit: 50,
  });

  // Fetch asset statistics
  const { data: statsData, isLoading: statsLoading } = api.assets.getAssetStats.useQuery({
    timeRange: '30d',
    type: selectedType || undefined,
  });

  const assetTypeOptions = [
    { value: '', label: 'All Types', icon: SparklesIcon },
    { value: 'IMAGE', label: 'Images', icon: PhotoIcon },
    { value: 'VIDEO', label: 'Videos', icon: VideoCameraIcon },
    { value: 'AUDIO', label: 'Audio', icon: SpeakerWaveIcon },
    { value: 'TEXT', label: 'Text', icon: DocumentTextIcon },
    { value: 'DESIGN', label: 'Designs', icon: PaintBrushIcon },
    { value: 'TEMPLATE', label: 'Templates', icon: DocumentTextIcon },
    { value: 'ANIMATION', label: 'Animations', icon: PlayIcon },
    { value: 'DATASET', label: 'Datasets', icon: DocumentTextIcon },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING', label: 'Pending Approval' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'social', label: 'Social Media' },
    { value: 'blog', label: 'Blog Content' },
    { value: 'ads', label: 'Advertisements' },
    { value: 'email', label: 'Email Templates' },
    { value: 'ui', label: 'UI Elements' },
    { value: 'brand', label: 'Brand Assets' },
    { value: 'product', label: 'Product Media' },
  ];

  const getAssetTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      IMAGE: PhotoIcon,
      VIDEO: VideoCameraIcon,
      AUDIO: SpeakerWaveIcon,
      TEXT: DocumentTextIcon,
      DESIGN: PaintBrushIcon,
      TEMPLATE: DocumentTextIcon,
      ANIMATION: PlayIcon,
      DATASET: DocumentTextIcon,
    };
    return iconMap[type] || SparklesIcon;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      DRAFT: 'text-gray-400',
      PENDING: 'text-neon-blue',
      APPROVED: 'text-neon-green',
      REJECTED: 'text-neon-pink',
      ARCHIVED: 'text-gray-500',
    };
    return colorMap[status] || 'text-gray-400';
  };

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, any> = {
      DRAFT: DocumentTextIcon,
      PENDING: ClockIcon,
      APPROVED: CheckCircleIcon,
      REJECTED: XCircleIcon,
      ARCHIVED: ExclamationTriangleIcon,
    };
    return iconMap[status] || ClockIcon;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const renderStarRating = (rating?: number) => {
    if (!rating) return null;

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <StarIconSolid
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
          />
        ))}
        <span className="text-xs text-secondary ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const AssetCard = ({ asset }: { asset: Asset }) => {
    const TypeIcon = getAssetTypeIcon(asset.type);
    const StatusIcon = getStatusIcon(asset.status);

    return (
      <div
        className="card-neon group cursor-pointer hover:scale-105 transition-all duration-300"
        onClick={() => setSelectedAsset(asset)}
      >
        {/* Asset Preview */}
        <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-2xl overflow-hidden">
          {asset.thumbnail ? (
            <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="h-16 w-16 text-gray-600" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <div
              className={`p-2 rounded-lg bg-black/50 backdrop-blur-sm ${getStatusColor(asset.status)}`}
            >
              <StatusIcon className="h-4 w-4" />
            </div>
          </div>

          {/* Type Badge */}
          <div className="absolute top-4 left-4">
            <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
              <span className="text-xs text-white font-medium">{asset.type}</span>
            </div>
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3">
            <button className="p-2 bg-neon-blue rounded-lg hover:bg-neon-purple transition-colors">
              <EyeIcon className="h-5 w-5 text-white" />
            </button>
            <button className="p-2 bg-neon-green rounded-lg hover:bg-neon-blue transition-colors">
              <ArrowDownTrayIcon className="h-5 w-5 text-white" />
            </button>
            <button className="p-2 bg-neon-pink rounded-lg hover:bg-neon-purple transition-colors">
              <ShareIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Asset Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-primary text-sm line-clamp-2">{asset.name}</h3>
            {asset.parent && (
              <div className="flex items-center text-xs text-neon-purple">
                <ArrowPathIcon className="h-3 w-3 mr-1" />v{asset.versions[0]?.version || '1.0'}
              </div>
            )}
          </div>

          {asset.description && (
            <p className="text-xs text-secondary line-clamp-2 mb-3">{asset.description}</p>
          )}

          {/* Tags */}
          {asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {asset.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-neon-blue/20 text-neon-blue text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {asset.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                  +{asset.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-secondary">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <EyeIcon className="h-3 w-3 mr-1" />
                {asset.usage}
              </div>
              <div className="flex items-center">
                <HeartIcon className="h-3 w-3 mr-1" />
                {asset.remixCount}
              </div>
            </div>
            {renderStarRating(asset.rating)}
          </div>

          <div className="mt-2 text-xs text-muted">
            {new Date(asset.createdAt).toLocaleDateString()}
          </div>
        </div>
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
              <span className="text-neon-purple">AI Asset</span> Library
            </h1>
            <p className="text-secondary text-lg">
              Centralized repository for AI-generated content and creative assets
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Upload Button */}
            <button onClick={() => setShowUploadModal(true)} className="btn-neon">
              <PlusIcon className="h-5 w-5 mr-2" />
              Upload Asset
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-neon-blue text-white' : 'text-gray-400'}`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-neon-blue text-white' : 'text-gray-400'}`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 flex items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary" />
            <input
              type="text"
              placeholder="Search assets by name, tags, or description..."
              className="input-neon pl-10 pr-4 py-3 w-full"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Toggle */}
          <button onClick={() => setShowFilters(!showFilters)} className="btn-neon-purple">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {showFilters ? (
              <ChevronDownIcon className="h-4 w-4 ml-2" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-6 glass p-6 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Asset Type</label>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="input-neon w-full"
                >
                  {assetTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="input-neon w-full"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="input-neon w-full"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-neon-purple rounded-xl flex items-center justify-center">
              <PhotoIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary">Total Assets</div>
              <div className="stat-number">{statsData?.totalAssets || 0}</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-neon-green rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary">Approved</div>
              <div className="stat-number">{statsData?.approvalStats?.approved || 0}</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-neon-blue rounded-xl flex items-center justify-center">
              <EyeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary">Total Usage</div>
              <div className="stat-number">{statsData?.totalUsage || 0}</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-neon-pink rounded-xl flex items-center justify-center">
              <ArrowPathIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary">Remixes</div>
              <div className="stat-number">{statsData?.totalRemixes || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Grid/List */}
      <div className="glass-strong p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Asset Collection</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-secondary">
              {assetsData?.totalCount || 0} total assets
            </span>
            {assetsLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neon-blue"></div>
            )}
          </div>
        </div>

        {assetsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {assetsData?.assets?.map((asset: Asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        ) : (
          // List view would go here
          <div className="space-y-4">
            {assetsData?.assets?.map((asset: Asset) => (
              <div key={asset.id} className="glass p-4 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                    {asset.thumbnail ? (
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <PhotoIcon className="h-8 w-8 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary">{asset.name}</h3>
                    <p className="text-sm text-secondary">{asset.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted">
                      <span>{asset.type}</span>
                      <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                      <span>{asset.usage} uses</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(asset.status)} bg-gray-800`}
                    >
                      {asset.status}
                    </span>
                    <button className="p-2 text-secondary hover:text-neon-blue">
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(!assetsData?.assets || assetsData.assets.length === 0) && !assetsLoading && (
          <div className="text-center py-20">
            <PhotoIcon className="h-20 w-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-medium text-primary mb-2">No Assets Found</h3>
            <p className="text-secondary mb-6">
              Start building your asset library by uploading your first creative asset.
            </p>
            <button onClick={() => setShowUploadModal(true)} className="btn-neon">
              <PlusIcon className="h-5 w-5 mr-2" />
              Upload First Asset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
