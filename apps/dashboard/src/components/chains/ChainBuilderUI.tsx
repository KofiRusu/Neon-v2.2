"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Save, 
  Play, 
  Trash2, 
  Settings, 
  ArrowRight, 
  ArrowDown,
  Copy,
  Eye,
  Zap,
  Users,
  GitBranch,
  Clock,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

// Types
interface ChainStep {
  id: string;
  stepNumber: number;
  stepName: string;
  stepType: 'AGENT_EXECUTION' | 'CONDITION_CHECK' | 'DATA_TRANSFORM' | 'PARALLEL_SYNC';
  agentType: 'CONTENT_AGENT' | 'TREND_AGENT' | 'SEO_AGENT' | 'SOCIAL_AGENT' | 'EMAIL_AGENT' | 'SUPPORT_AGENT';
  agentConfig?: Record<string, any>;
  dependsOn?: number[];
  conditions?: any[];
  position: { x: number; y: number };
  retries?: number;
  timeout?: number;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
}

interface ChainDefinition {
  name: string;
  description?: string;
  chainType: 'SEQUENTIAL' | 'PARALLEL' | 'CONDITIONAL' | 'LOOP' | 'FEEDBACK' | 'HYBRID';
  executionMode: 'SEQUENTIAL' | 'PARALLEL' | 'ADAPTIVE' | 'BATCH';
  steps: ChainStep[];
  successCriteria: {
    minStepsCompleted?: number;
    requiredSteps?: number[];
    minQualityScore?: number;
    maxErrorRate?: number;
    customConditions?: Record<string, any>;
  };
  maxRetries?: number;
  timeoutMinutes?: number;
  budgetLimit?: number;
}

interface ChainBuilderUIProps {
  initialChain?: ChainDefinition;
  onSave?: (chain: ChainDefinition) => void;
  onExecute?: (chain: ChainDefinition) => void;
  onClose?: () => void;
  isReadOnly?: boolean;
  className?: string;
}

const AGENT_TYPES = [
  { value: 'CONTENT_AGENT', label: 'Content Agent', icon: '📝', color: 'bg-blue-500' },
  { value: 'TREND_AGENT', label: 'Trend Agent', icon: '📈', color: 'bg-green-500' },
  { value: 'SEO_AGENT', label: 'SEO Agent', icon: '🔍', color: 'bg-purple-500' },
  { value: 'SOCIAL_AGENT', label: 'Social Agent', icon: '📱', color: 'bg-pink-500' },
  { value: 'EMAIL_AGENT', label: 'Email Agent', icon: '📧', color: 'bg-orange-500' },
  { value: 'SUPPORT_AGENT', label: 'Support Agent', icon: '🎧', color: 'bg-red-500' }
];

const CHAIN_TYPES = [
  { value: 'SEQUENTIAL', label: 'Sequential', description: 'Execute steps one after another' },
  { value: 'PARALLEL', label: 'Parallel', description: 'Execute steps simultaneously' },
  { value: 'CONDITIONAL', label: 'Conditional', description: 'Execute based on conditions' },
  { value: 'LOOP', label: 'Loop', description: 'Repeat steps iteratively' },
  { value: 'FEEDBACK', label: 'Feedback', description: 'Include feedback loops' },
  { value: 'HYBRID', label: 'Hybrid', description: 'Combination of multiple types' }
];

const EXECUTION_MODES = [
  { value: 'SEQUENTIAL', label: 'Sequential', description: 'One step at a time' },
  { value: 'PARALLEL', label: 'Parallel', description: 'Multiple steps at once' },
  { value: 'ADAPTIVE', label: 'Adaptive', description: 'System decides optimal execution' },
  { value: 'BATCH', label: 'Batch', description: 'Process in batches' }
];

export default function ChainBuilderUI({
  initialChain,
  onSave,
  onExecute,
  onClose,
  isReadOnly = false,
  className
}: ChainBuilderUIProps) {
  const [chain, setChain] = useState<ChainDefinition>(initialChain || {
    name: 'New Chain',
    description: '',
    chainType: 'SEQUENTIAL',
    executionMode: 'SEQUENTIAL',
    steps: [],
    successCriteria: {
      minQualityScore: 0.7,
      maxErrorRate: 0.2
    },
    maxRetries: 3,
    timeoutMinutes: 60
  });

  const [selectedStep, setSelectedStep] = useState<ChainStep | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedStep, setDraggedStep] = useState<ChainStep | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Initialize canvas size
  useEffect(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
    }
  }, []);

  // Add new step
  const addStep = useCallback((agentType: string, position?: { x: number; y: number }) => {
    if (isReadOnly) return;

    const newStep: ChainStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stepNumber: chain.steps.length,
      stepName: `${agentType.replace('_AGENT', '').toLowerCase()} step`,
      stepType: 'AGENT_EXECUTION',
      agentType: agentType as any,
      position: position || { x: 100 + chain.steps.length * 200, y: 100 },
      retries: 3,
      timeout: 30000
    };

    setChain(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));

    setSelectedStep(newStep);
  }, [chain.steps.length, isReadOnly]);

  // Remove step
  const removeStep = useCallback((stepId: string) => {
    if (isReadOnly) return;

    setChain(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId).map((step, index) => ({
        ...step,
        stepNumber: index,
        dependsOn: step.dependsOn?.filter(dep => dep < prev.steps.length - 1)
      }))
    }));

    setSelectedStep(null);
  }, [isReadOnly]);

  // Update step
  const updateStep = useCallback((stepId: string, updates: Partial<ChainStep>) => {
    if (isReadOnly) return;

    setChain(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));

    if (selectedStep?.id === stepId) {
      setSelectedStep(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedStep, isReadOnly]);

  // Move step
  const moveStep = useCallback((stepId: string, position: { x: number; y: number }) => {
    if (isReadOnly) return;

    updateStep(stepId, { position });
  }, [updateStep, isReadOnly]);

  // Add dependency
  const addDependency = useCallback((stepId: string, dependsOnStepNumber: number) => {
    if (isReadOnly) return;

    const step = chain.steps.find(s => s.id === stepId);
    if (!step) return;

    const newDependsOn = [...(step.dependsOn || []), dependsOnStepNumber];
    updateStep(stepId, { dependsOn: newDependsOn });
  }, [chain.steps, updateStep, isReadOnly]);

  // Remove dependency
  const removeDependency = useCallback((stepId: string, dependsOnStepNumber: number) => {
    if (isReadOnly) return;

    const step = chain.steps.find(s => s.id === stepId);
    if (!step) return;

    const newDependsOn = (step.dependsOn || []).filter(dep => dep !== dependsOnStepNumber);
    updateStep(stepId, { dependsOn: newDependsOn });
  }, [chain.steps, updateStep, isReadOnly]);

  // Validate chain
  const validateChain = useCallback(async () => {
    setIsValidating(true);
    
    try {
      // Basic validation
      const validation = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        suggestions: [] as string[]
      };

      // Check for empty chain
      if (chain.steps.length === 0) {
        validation.isValid = false;
        validation.errors.push('Chain must have at least one step');
      }

      // Check for duplicate step numbers
      const stepNumbers = chain.steps.map(s => s.stepNumber);
      const uniqueStepNumbers = [...new Set(stepNumbers)];
      if (stepNumbers.length !== uniqueStepNumbers.length) {
        validation.isValid = false;
        validation.errors.push('Duplicate step numbers detected');
      }

      // Check dependencies
      for (const step of chain.steps) {
        if (step.dependsOn) {
          for (const dep of step.dependsOn) {
            if (dep >= step.stepNumber) {
              validation.isValid = false;
              validation.errors.push(`Step ${step.stepNumber} cannot depend on step ${dep} (circular dependency)`);
            }
            if (!stepNumbers.includes(dep)) {
              validation.isValid = false;
              validation.errors.push(`Step ${step.stepNumber} depends on non-existent step ${dep}`);
            }
          }
        }
      }

      // Performance suggestions
      if (chain.steps.length > 5) {
        validation.suggestions.push('Consider breaking complex chains into smaller, reusable components');
      }

      if (chain.executionMode === 'SEQUENTIAL' && chain.steps.length > 3) {
        validation.suggestions.push('Consider parallel execution for better performance');
      }

      setValidationResult(validation);
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: ['Validation failed: ' + (error as Error).message],
        warnings: [],
        suggestions: []
      });
    } finally {
      setIsValidating(false);
    }
  }, [chain]);

  // Save chain
  const saveChain = useCallback(() => {
    if (isReadOnly) return;

    validateChain().then(() => {
      if (validationResult?.isValid) {
        onSave?.(chain);
        toast({
          title: "Chain Saved",
          description: "Your chain has been saved successfully.",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: "Please fix the validation errors before saving.",
          variant: "destructive",
        });
      }
    });
  }, [chain, onSave, validateChain, validationResult, isReadOnly]);

  // Execute chain
  const executeChain = useCallback(() => {
    if (isReadOnly) return;

    validateChain().then(() => {
      if (validationResult?.isValid) {
        onExecute?.(chain);
        toast({
          title: "Chain Execution Started",
          description: "Your chain is now executing.",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: "Please fix the validation errors before executing.",
          variant: "destructive",
        });
      }
    });
  }, [chain, onExecute, validateChain, validationResult, isReadOnly]);

  // Canvas event handlers
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isReadOnly) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Check if clicking on a step
    const clickedStep = chain.steps.find(step => {
      const stepX = step.position.x;
      const stepY = step.position.y;
      const stepWidth = 200;
      const stepHeight = 100;

      return x >= stepX && x <= stepX + stepWidth && y >= stepY && y <= stepY + stepHeight;
    });

    if (clickedStep) {
      setSelectedStep(clickedStep);
    } else {
      setSelectedStep(null);
    }
  }, [chain.steps, pan, zoom, isReadOnly]);

  const handleStepDrag = useCallback((stepId: string, e: React.MouseEvent) => {
    if (isReadOnly) return;

    const step = chain.steps.find(s => s.id === stepId);
    if (!step) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startPosition = { ...step.position };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - startX) / zoom;
      const deltaY = (e.clientY - startY) / zoom;

      moveStep(stepId, {
        x: startPosition.x + deltaX,
        y: startPosition.y + deltaY
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [chain.steps, zoom, moveStep, isReadOnly]);

  // Render step
  const renderStep = useCallback((step: ChainStep) => {
    const agentInfo = AGENT_TYPES.find(a => a.value === step.agentType);
    const isSelected = selectedStep?.id === step.id;

    return (
      <div
        key={step.id}
        className={`absolute border-2 rounded-lg p-4 bg-white shadow-lg cursor-move transition-all duration-200 ${
          isSelected ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-gray-300'
        }`}
        style={{
          left: step.position.x,
          top: step.position.y,
          width: 200,
          minHeight: 100,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left'
        }}
        onMouseDown={(e) => handleStepDrag(step.id, e)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedStep(step);
        }}
      >
        {/* Step Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full ${agentInfo?.color || 'bg-gray-500'} flex items-center justify-center text-white text-xs font-bold`}>
              {step.stepNumber}
            </div>
            <span className="text-xs text-gray-600">{agentInfo?.icon}</span>
          </div>
          {!isReadOnly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                removeStep(step.id);
              }}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 size={12} />
            </Button>
          )}
        </div>

        {/* Step Content */}
        <div className="space-y-1">
          <div className="font-medium text-sm truncate">{step.stepName}</div>
          <div className="text-xs text-gray-600">{agentInfo?.label}</div>
          
          {/* Dependencies */}
          {step.dependsOn && step.dependsOn.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <ArrowDown size={10} />
              <span>Depends on: {step.dependsOn.join(', ')}</span>
            </div>
          )}

          {/* Configuration indicators */}
          <div className="flex items-center gap-1 mt-2">
            {step.retries && step.retries > 0 && (
              <Badge variant="outline" className="text-xs">
                {step.retries} retries
              </Badge>
            )}
            {step.timeout && (
              <Badge variant="outline" className="text-xs">
                {step.timeout / 1000}s timeout
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }, [selectedStep, zoom, handleStepDrag, removeStep, isReadOnly]);

  // Render connections
  const renderConnections = useCallback(() => {
    const connections: JSX.Element[] = [];

    chain.steps.forEach(step => {
      if (step.dependsOn) {
        step.dependsOn.forEach(depStepNumber => {
          const depStep = chain.steps.find(s => s.stepNumber === depStepNumber);
          if (depStep) {
            const startX = depStep.position.x + 100; // Center of step
            const startY = depStep.position.y + 100;
            const endX = step.position.x + 100;
            const endY = step.position.y + 50;

            connections.push(
              <svg
                key={`${depStep.id}-${step.id}`}
                className="absolute pointer-events-none"
                style={{
                  left: 0,
                  top: 0,
                  width: canvasSize.width,
                  height: canvasSize.height,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left'
                }}
              >
                <defs>
                  <marker
                    id={`arrowhead-${depStep.id}-${step.id}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="10"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#6B7280"
                    />
                  </marker>
                </defs>
                <path
                  d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${startY - 50} ${endX} ${endY}`}
                  stroke="#6B7280"
                  strokeWidth="2"
                  fill="none"
                  markerEnd={`url(#arrowhead-${depStep.id}-${step.id})`}
                />
              </svg>
            );
          }
        });
      }
    });

    return connections;
  }, [chain.steps, canvasSize, zoom]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">{chain.name}</h2>
            <p className="text-sm text-gray-600">{chain.description || 'No description'}</p>
          </div>
          {validationResult && (
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm">
                {validationResult.isValid ? 'Valid' : `${validationResult.errors.length} errors`}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={validateChain}
            disabled={isValidating}
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Validate
          </Button>
          {!isReadOnly && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={saveChain}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                size="sm"
                onClick={executeChain}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute
              </Button>
            </>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Agent Palette */}
            <div>
              <h3 className="font-medium mb-3">Agent Types</h3>
              <div className="space-y-2">
                {AGENT_TYPES.map(agent => (
                  <div
                    key={agent.value}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-white cursor-pointer hover:bg-gray-50"
                    onClick={() => !isReadOnly && addStep(agent.value)}
                  >
                    <div className={`w-8 h-8 rounded-full ${agent.color} flex items-center justify-center text-white text-sm`}>
                      {agent.icon}
                    </div>
                    <span className="text-sm font-medium">{agent.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chain Info */}
            <div>
              <h3 className="font-medium mb-3">Chain Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Steps:</span>
                  <span>{chain.steps.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <Badge variant="outline">{chain.chainType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode:</span>
                  <Badge variant="outline">{chain.executionMode}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timeout:</span>
                  <span>{chain.timeoutMinutes}m</span>
                </div>
                {chain.budgetLimit && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget:</span>
                    <span>${chain.budgetLimit}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Step Configuration */}
            {selectedStep && (
              <div>
                <h3 className="font-medium mb-3">Step Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="stepName">Step Name</Label>
                    <Input
                      id="stepName"
                      value={selectedStep.stepName}
                      onChange={(e) => updateStep(selectedStep.id, { stepName: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="retries">Retries</Label>
                    <Input
                      id="retries"
                      type="number"
                      value={selectedStep.retries || 0}
                      onChange={(e) => updateStep(selectedStep.id, { retries: parseInt(e.target.value) })}
                      disabled={isReadOnly}
                      min="0"
                      max="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={selectedStep.timeout ? selectedStep.timeout / 1000 : 30}
                      onChange={(e) => updateStep(selectedStep.id, { timeout: parseInt(e.target.value) * 1000 })}
                      disabled={isReadOnly}
                      min="1"
                      max="3600"
                    />
                  </div>
                  
                  {/* Dependencies */}
                  <div>
                    <Label>Dependencies</Label>
                    <div className="space-y-2">
                      {chain.steps
                        .filter(s => s.stepNumber < selectedStep.stepNumber)
                        .map(step => (
                          <div key={step.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedStep.dependsOn?.includes(step.stepNumber) || false}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  addDependency(selectedStep.id, step.stepNumber);
                                } else {
                                  removeDependency(selectedStep.id, step.stepNumber);
                                }
                              }}
                              disabled={isReadOnly}
                            />
                            <span className="text-sm">{step.stepName}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="w-full h-full bg-gray-100 relative cursor-crosshair"
            onClick={handleCanvasClick}
          >
            {/* Grid */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern
                    id="grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Connections */}
            {renderConnections()}

            {/* Steps */}
            {chain.steps.map(renderStep)}

            {/* Empty state */}
            {chain.steps.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No steps yet</h3>
                  <p className="text-gray-600 mb-4">Add agents from the sidebar to build your chain</p>
                  {!isReadOnly && (
                    <Button
                      onClick={() => addStep('CONTENT_AGENT', { x: 300, y: 200 })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Step
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(zoom => Math.max(0.1, zoom - 0.1))}
            >
              −
            </Button>
            <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(zoom => Math.min(2, zoom + 0.1))}
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chain Settings</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="execution">Execution</TabsTrigger>
              <TabsTrigger value="criteria">Success Criteria</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div>
                <Label htmlFor="chainName">Chain Name</Label>
                <Input
                  id="chainName"
                  value={chain.name}
                  onChange={(e) => setChain(prev => ({ ...prev, name: e.target.value }))}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="chainDescription">Description</Label>
                <Textarea
                  id="chainDescription"
                  value={chain.description || ''}
                  onChange={(e) => setChain(prev => ({ ...prev, description: e.target.value }))}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="chainType">Chain Type</Label>
                <Select
                  value={chain.chainType}
                  onValueChange={(value) => setChain(prev => ({ ...prev, chainType: value as any }))}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHAIN_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="execution" className="space-y-4">
              <div>
                <Label htmlFor="executionMode">Execution Mode</Label>
                <Select
                  value={chain.executionMode}
                  onValueChange={(value) => setChain(prev => ({ ...prev, executionMode: value as any }))}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXECUTION_MODES.map(mode => (
                      <SelectItem key={mode.value} value={mode.value}>
                        <div>
                          <div className="font-medium">{mode.label}</div>
                          <div className="text-sm text-gray-600">{mode.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maxRetries">Max Retries</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  value={chain.maxRetries || 3}
                  onChange={(e) => setChain(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                  disabled={isReadOnly}
                  min="0"
                  max="10"
                />
              </div>
              <div>
                <Label htmlFor="timeoutMinutes">Timeout (minutes)</Label>
                <Input
                  id="timeoutMinutes"
                  type="number"
                  value={chain.timeoutMinutes || 60}
                  onChange={(e) => setChain(prev => ({ ...prev, timeoutMinutes: parseInt(e.target.value) }))}
                  disabled={isReadOnly}
                  min="1"
                  max="1440"
                />
              </div>
              <div>
                <Label htmlFor="budgetLimit">Budget Limit ($)</Label>
                <Input
                  id="budgetLimit"
                  type="number"
                  value={chain.budgetLimit || ''}
                  onChange={(e) => setChain(prev => ({ ...prev, budgetLimit: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  disabled={isReadOnly}
                  min="0"
                  step="0.01"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="criteria" className="space-y-4">
              <div>
                <Label htmlFor="minQualityScore">Minimum Quality Score</Label>
                <Input
                  id="minQualityScore"
                  type="number"
                  value={chain.successCriteria.minQualityScore || 0.7}
                  onChange={(e) => setChain(prev => ({
                    ...prev,
                    successCriteria: {
                      ...prev.successCriteria,
                      minQualityScore: parseFloat(e.target.value)
                    }
                  }))}
                  disabled={isReadOnly}
                  min="0"
                  max="1"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="maxErrorRate">Maximum Error Rate</Label>
                <Input
                  id="maxErrorRate"
                  type="number"
                  value={chain.successCriteria.maxErrorRate || 0.2}
                  onChange={(e) => setChain(prev => ({
                    ...prev,
                    successCriteria: {
                      ...prev.successCriteria,
                      maxErrorRate: parseFloat(e.target.value)
                    }
                  }))}
                  disabled={isReadOnly}
                  min="0"
                  max="1"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="minStepsCompleted">Minimum Steps Completed</Label>
                <Input
                  id="minStepsCompleted"
                  type="number"
                  value={chain.successCriteria.minStepsCompleted || ''}
                  onChange={(e) => setChain(prev => ({
                    ...prev,
                    successCriteria: {
                      ...prev.successCriteria,
                      minStepsCompleted: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  }))}
                  disabled={isReadOnly}
                  min="0"
                  max={chain.steps.length}
                />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chain Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Chain Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span>{chain.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span>{chain.chainType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Execution Mode:</span>
                    <span>{chain.executionMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Steps:</span>
                    <span>{chain.steps.length}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Execution Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Retries:</span>
                    <span>{chain.maxRetries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timeout:</span>
                    <span>{chain.timeoutMinutes}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget:</span>
                    <span>{chain.budgetLimit ? `$${chain.budgetLimit}` : 'No limit'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Execution Flow</h4>
              <div className="space-y-2">
                {chain.steps
                  .sort((a, b) => a.stepNumber - b.stepNumber)
                  .map((step, index) => {
                    const agentInfo = AGENT_TYPES.find(a => a.value === step.agentType);
                    return (
                      <div key={step.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${agentInfo?.color} flex items-center justify-center text-white text-sm font-bold`}>
                            {step.stepNumber}
                          </div>
                          <span className="text-sm">{agentInfo?.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{step.stepName}</div>
                          <div className="text-sm text-gray-600">{agentInfo?.label}</div>
                        </div>
                        {step.dependsOn && step.dependsOn.length > 0 && (
                          <div className="text-sm text-gray-500">
                            Depends on: {step.dependsOn.join(', ')}
                          </div>
                        )}
                        {index < chain.steps.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 