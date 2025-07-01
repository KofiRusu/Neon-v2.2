'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  LightBulbIcon,
  PlayIcon,
  EyeIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { trpc } from '../../utils/trpc';

interface ReasoningNode {
  id: string;
  parentId?: string;
  type: 'thought' | 'action' | 'observation' | 'decision';
  content: string;
  timestamp: string;
  metadata?: any;
  children?: ReasoningNode[];
}

interface ReasoningTreeProps {
  sessionId: string;
}

export default function ReasoningTree({ sessionId }: ReasoningTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { data: sessionData, isLoading } = trpc.copilot.getReasoningSession.useQuery({ sessionId });

  const reasoning = sessionData?.data?.reasoning || [];

  // Mock reasoning tree if no data
  const mockReasoning: ReasoningNode[] = [
    {
      id: 'thought-1',
      type: 'thought',
      content: 'User wants to analyze campaign performance and optimize strategies',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      children: [
        {
          id: 'action-1',
          parentId: 'thought-1',
          type: 'action',
          content: 'Retrieve all active campaign data',
          timestamp: new Date(Date.now() - 550000).toISOString(),
          children: [
            {
              id: 'observation-1',
              parentId: 'action-1',
              type: 'observation',
              content: 'Found 12 active campaigns with varying performance levels',
              timestamp: new Date(Date.now() - 500000).toISOString(),
              metadata: { campaigns: 12, avgCTR: 2.4, avgConversion: 1.8 }
            }
          ]
        }
      ]
    },
    {
      id: 'thought-2',
      type: 'thought',
      content: 'Need to identify top-performing and underperforming campaigns',
      timestamp: new Date(Date.now() - 450000).toISOString(),
      children: [
        {
          id: 'action-2',
          parentId: 'thought-2',
          type: 'action',
          content: 'Calculate performance metrics and rank campaigns',
          timestamp: new Date(Date.now() - 400000).toISOString(),
          children: [
            {
              id: 'observation-2',
              parentId: 'action-2',
              type: 'observation',
              content: 'Top 3 campaigns: Email Newsletter (4.2% CTR), Social Ads (3.8% CTR), Content Marketing (3.1% CTR)',
              timestamp: new Date(Date.now() - 350000).toISOString(),
              metadata: { topCampaigns: 3, bottomCampaigns: 3 }
            }
          ]
        }
      ]
    },
    {
      id: 'thought-3',
      type: 'thought',
      content: 'Analyzing patterns in high-performing campaigns',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      children: [
        {
          id: 'decision-1',
          parentId: 'thought-3',
          type: 'decision',
          content: 'Focus optimization on audience targeting, content quality, and timing',
          timestamp: new Date(Date.now() - 250000).toISOString(),
          metadata: { factors: ['targeting', 'content', 'timing'] }
        }
      ]
    }
  ];

  // Convert flat array to tree structure
  const buildTree = (nodes: any[]): ReasoningNode[] => {
    const nodeMap = new Map<string, ReasoningNode>();
    const rootNodes: ReasoningNode[] = [];

    // Create node map
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Build tree structure
    nodes.forEach(node => {
      const treeNode = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(treeNode);
      } else {
        rootNodes.push(treeNode);
      }
    });

    return rootNodes;
  };

  const displayNodes = reasoning.length > 0 ? buildTree(reasoning) : mockReasoning;

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const selectNode = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'thought':
        return <LightBulbIcon className="w-4 h-4 text-yellow-600" />;
      case 'action':
        return <PlayIcon className="w-4 h-4 text-blue-600" />;
      case 'observation':
        return <EyeIcon className="w-4 h-4 text-green-600" />;
      case 'decision':
        return <CheckCircleIcon className="w-4 h-4 text-purple-600" />;
      default:
        return <ShareIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'thought':
        return 'border-yellow-200 bg-yellow-50';
      case 'action':
        return 'border-blue-200 bg-blue-50';
      case 'observation':
        return 'border-green-200 bg-green-50';
      case 'decision':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderNode = (node: ReasoningNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;

    return (
      <div key={node.id} className="space-y-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`relative ${level > 0 ? 'ml-6' : ''}`}
        >
          {/* Connection Line */}
          {level > 0 && (
            <div className="absolute -left-6 top-6 w-6 h-px bg-gray-300" />
          )}
          
          {/* Vertical Line for Children */}
          {hasChildren && isExpanded && (
            <div className="absolute left-4 top-12 w-px bg-gray-300" style={{ height: 'calc(100% - 24px)' }} />
          )}

          <div
            className={`border rounded-lg p-3 cursor-pointer transition-all ${getNodeColor(node.type)} ${
              isSelected ? 'ring-2 ring-blue-400' : ''
            }`}
            onClick={() => selectNode(node.id)}
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                {getNodeIcon(node.type)}
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNode(node.id);
                    }}
                    className="p-1 hover:bg-white/50 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {node.type}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatTime(node.timestamp)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{node.content}</p>
                
                {node.metadata && (
                  <div className="text-xs text-gray-600 bg-white/50 p-2 rounded mt-2">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(node.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {node.children!.map(child => renderNode(child, level + 1))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Reasoning Process</h3>
            <p className="text-sm text-gray-500">
              {displayNodes.length} reasoning steps
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedNodes(new Set(getAllNodeIds(displayNodes)))}
              className="text-xs"
            >
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedNodes(new Set())}
              className="text-xs"
            >
              Collapse All
            </Button>
          </div>
        </div>
      </div>

      {/* Tree Visualization */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : displayNodes.length > 0 ? (
            displayNodes.map(node => renderNode(node))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShareIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No reasoning data available yet</p>
              <p className="text-sm">Start a conversation to see the reasoning process</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <LightBulbIcon className="w-3 h-3 text-yellow-600" />
            <span>Thought</span>
          </div>
          <div className="flex items-center gap-2">
            <PlayIcon className="w-3 h-3 text-blue-600" />
            <span>Action</span>
          </div>
          <div className="flex items-center gap-2">
            <EyeIcon className="w-3 h-3 text-green-600" />
            <span>Observation</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-3 h-3 text-purple-600" />
            <span>Decision</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get all node IDs for expand all functionality
function getAllNodeIds(nodes: ReasoningNode[]): string[] {
  const ids: string[] = [];
  
  const traverse = (nodeList: ReasoningNode[]) => {
    nodeList.forEach(node => {
      ids.push(node.id);
      if (node.children) {
        traverse(node.children);
      }
    });
  };
  
  traverse(nodes);
  return ids;
} 