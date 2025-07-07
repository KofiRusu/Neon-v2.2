"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TonePreviewProps {
  onToneChange?: (tone: string, segment: string) => void;
  initialTone?: string;
  initialSegment?: string;
}

interface ToneExample {
  tone: string;
  segment: string;
  examples: string[];
  description: string;
  confidence: number;
}

const SEGMENTS = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'smb', label: 'Small & Medium Business' },
  { value: 'agencies', label: 'Agencies' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'investor', label: 'Investor' },
  { value: 'gen_z', label: 'Gen Z' }
];

const TONE_EXAMPLES: Record<string, ToneExample> = {
  'enterprise': {
    tone: 'authoritative and strategic',
    segment: 'enterprise',
    examples: [
      'Streamline your operations with enterprise-grade AI automation',
      'Strategic implementation of AI-driven marketing solutions',
      'Transform your organizational efficiency with intelligent automation'
    ],
    description: 'Professional, confident, and focused on business impact',
    confidence: 0.92
  },
  'smb': {
    tone: 'approachable and growth-focused',
    segment: 'smb',
    examples: [
      'Grow your business with easy-to-use AI marketing tools',
      'Affordable automation solutions that deliver real results',
      'Simple, powerful tools to boost your marketing efforts'
    ],
    description: 'Friendly, accessible, and results-oriented',
    confidence: 0.88
  },
  'agencies': {
    tone: 'collaborative and expertise-driven',
    segment: 'agencies',
    examples: [
      'Deliver exceptional client results with our AI-powered platform',
      'Scale your agency operations with intelligent automation',
      'Partner with us to enhance your service offerings'
    ],
    description: 'Professional collaboration with proven expertise',
    confidence: 0.85
  },
  'ecommerce': {
    tone: 'results-driven and conversion-focused',
    segment: 'ecommerce',
    examples: [
      'Increase your conversion rates with AI-driven personalization',
      'Boost your ROI with data-driven marketing automation',
      'Drive more sales with intelligent customer targeting'
    ],
    description: 'Performance-focused with clear value propositions',
    confidence: 0.91
  },
  'saas': {
    tone: 'technical and innovation-focused',
    segment: 'saas',
    examples: [
      'Integrate seamlessly with our robust API infrastructure',
      'Enhance your product with AI-powered marketing features',
      'Scale your user acquisition with intelligent automation'
    ],
    description: 'Technical depth with innovation emphasis',
    confidence: 0.87
  },
  'consumer': {
    tone: 'friendly and engaging',
    segment: 'consumer',
    examples: [
      'Discover the fun side of AI marketing automation',
      'Make your brand shine with personalized experiences',
      'Connect with your audience like never before'
    ],
    description: 'Warm, personal, and accessible communication',
    confidence: 0.89
  },
  'investor': {
    tone: 'confident and data-driven',
    segment: 'investor',
    examples: [
      'ROI-focused AI marketing platform with proven scalability',
      'Data-driven growth metrics demonstrate market leadership',
      'Strategic positioning in the $50B marketing automation sector'
    ],
    description: 'Analytical, confident, and metric-focused',
    confidence: 0.94
  },
  'gen_z': {
    tone: 'authentic and trend-aware',
    segment: 'gen_z',
    examples: [
      'AI that actually gets your vibe and aesthetic',
      'Create content that hits different with our smart tools',
      'Level up your brand game with AI that\'s actually lit'
    ],
    description: 'Current, authentic, and culturally relevant',
    confidence: 0.83
  }
};

export const TonePreview: React.FC<TonePreviewProps> = ({
  onToneChange,
  initialTone = 'professional',
  initialSegment = 'enterprise'
}) => {
  const [selectedSegment, setSelectedSegment] = useState(initialSegment);
  const [customContent, setCustomContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('examples');

  const currentExample = TONE_EXAMPLES[selectedSegment];

  useEffect(() => {
    if (onToneChange && currentExample) {
      onToneChange(currentExample.tone, selectedSegment);
    }
  }, [selectedSegment, currentExample, onToneChange]);

  const handleSegmentChange = (segment: string) => {
    setSelectedSegment(segment);
    setPreviewContent('');
  };

  const analyzeCustomContent = async () => {
    if (!customContent.trim()) return;

    setIsAnalyzing(true);
    try {
      // Simulate tone analysis API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock analysis result
      const analysisResult = `
**Original Content:** ${customContent}

**Adapted for ${SEGMENTS.find(s => s.value === selectedSegment)?.label}:**
${customContent.replace(/\b(easy|simple)\b/gi, 'streamlined').replace(/\b(great|good)\b/gi, 'exceptional')}

**Tone Analysis:**
- Current tone alignment: ${Math.floor(Math.random() * 30) + 70}%
- Recommended adjustments: Use more ${currentExample.tone} language
- Segment-specific suggestions: Include ${selectedSegment}-focused terminology
      `;
      
      setPreviewContent(analysisResult);
    } catch (error) {
      console.error('Failed to analyze content:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Tone Preview & Testing
            <Select value={selectedSegment} onValueChange={handleSegmentChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select audience segment" />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTS.map((segment) => (
                  <SelectItem key={segment.value} value={segment.value}>
                    {segment.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="examples">Tone Examples</TabsTrigger>
              <TabsTrigger value="custom">Test Custom Content</TabsTrigger>
            </TabsList>

            <TabsContent value="examples" className="space-y-4">
              {currentExample && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-sm">
                      {currentExample.tone}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getConfidenceColor(currentExample.confidence)}`} />
                      <span className="text-sm text-muted-foreground">
                        {Math.round(currentExample.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {currentExample.description}
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-medium">Example Messages:</h4>
                    {currentExample.examples.map((example, index) => (
                      <div
                        key={index}
                        className="p-3 bg-muted rounded-lg border-l-4 border-primary"
                      >
                        <p className="text-sm">{example}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border">
                    <h5 className="font-medium text-blue-900 mb-2">Tone Characteristics</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Primary Tone:</strong> {currentExample.tone.split(' and ')[0]}
                      </div>
                      <div>
                        <strong>Secondary Tone:</strong> {currentExample.tone.split(' and ')[1] || 'N/A'}
                      </div>
                      <div>
                        <strong>Target Segment:</strong> {SEGMENTS.find(s => s.value === selectedSegment)?.label}
                      </div>
                      <div>
                        <strong>Confidence Level:</strong> {Math.round(currentExample.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Test Your Content
                  </label>
                  <Textarea
                    placeholder="Enter your content to see how it would be adapted for the selected audience segment..."
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <Button 
                  onClick={analyzeCustomContent}
                  disabled={!customContent.trim() || isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? 'Analyzing Tone...' : 'Analyze & Adapt Tone'}
                </Button>

                {previewContent && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Tone Analysis Result:</h4>
                    <div className="p-4 bg-muted rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {previewContent}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tone Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium mb-2">Do's for {SEGMENTS.find(s => s.value === selectedSegment)?.label}</h5>
              <ul className="text-sm space-y-1 text-green-700">
                <li>• Use {currentExample?.tone} language</li>
                <li>• Focus on {selectedSegment === 'enterprise' ? 'business impact' : 'practical benefits'}</li>
                <li>• Include {selectedSegment === 'saas' ? 'technical details' : 'clear value propositions'}</li>
                <li>• Maintain {selectedSegment === 'gen_z' ? 'authentic voice' : 'professional credibility'}</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Don'ts</h5>
              <ul className="text-sm space-y-1 text-red-700">
                <li>• Avoid overly {selectedSegment === 'enterprise' ? 'casual' : 'formal'} language</li>
                <li>• Don't use {selectedSegment === 'gen_z' ? 'outdated slang' : 'jargon without explanation'}</li>
                <li>• Avoid {selectedSegment === 'investor' ? 'emotional appeals' : 'feature-heavy'} content</li>
                <li>• Don't ignore {selectedSegment === 'consumer' ? 'personal benefits' : 'business objectives'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TonePreview;