'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Sparkles, Tag, Globe, FileText, BarChart3, Target, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AgentPanel from '@/components/ui/AgentPanel';
import AgentOutput from '@/components/ui/AgentOutput';

import { trpc } from '@/utils/trpc';

// Zod schemas for different SEO tasks
const SEOContentAnalysisSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be less than 10,000 characters'),
  targetKeywords: z.array(z.string()).min(1, 'At least one target keyword is required'),
  contentType: z.enum(['blog', 'page', 'product', 'article'], {
    required_error: 'Please select a content type',
  }),
  title: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  focusKeyword: z.string().optional(),
  businessContext: z.string().optional(),
  targetAudience: z.string().optional(),
});

const SEOMetaTagsSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be less than 10,000 characters'),
  keywords: z.array(z.string()).optional(),
  businessContext: z.string().optional(),
  targetAudience: z.string().optional(),
  contentType: z.enum(['blog', 'page', 'product', 'article']).optional(),
});

const SEOKeywordRecommendationSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic must be less than 200 characters'),
  businessContext: z.string().optional(),
});

const SEOTechnicalAuditSchema = z.object({
  url: z.string().url('Valid URL is required'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be less than 10,000 characters'),
});

type SEOContentAnalysisData = z.infer<typeof SEOContentAnalysisSchema>;
type SEOMetaTagsData = z.infer<typeof SEOMetaTagsSchema>;
type SEOKeywordRecommendationData = z.infer<typeof SEOKeywordRecommendationSchema>;
type SEOTechnicalAuditData = z.infer<typeof SEOTechnicalAuditSchema>;

export default function SEOAgentPage() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [output, setOutput] = useState('');
  const [outputMetadata, setOutputMetadata] = useState<any>(null);

  // Multiple forms for different tabs
  const analysisForm = useForm<SEOContentAnalysisData>({
    resolver: zodResolver(SEOContentAnalysisSchema),
    defaultValues: {
      content: '',
      targetKeywords: [],
      contentType: 'blog',
      title: '',
      description: '',
      url: '',
      focusKeyword: '',
      businessContext: '',
      targetAudience: '',
    },
  });

  const metaTagsForm = useForm<SEOMetaTagsData>({
    resolver: zodResolver(SEOMetaTagsSchema),
    defaultValues: {
      topic: '',
      content: '',
      keywords: [],
      businessContext: '',
      targetAudience: '',
      contentType: 'blog',
    },
  });

  const keywordForm = useForm<SEOKeywordRecommendationData>({
    resolver: zodResolver(SEOKeywordRecommendationSchema),
    defaultValues: {
      topic: '',
      businessContext: '',
    },
  });

  const auditForm = useForm<SEOTechnicalAuditData>({
    resolver: zodResolver(SEOTechnicalAuditSchema),
    defaultValues: {
      url: '',
      content: '',
    },
  });

  // tRPC mutations
  const analyzeContentMutation = trpc.agents.seo.analyzeContent.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.analysis || 'SEO analysis completed successfully!');
        setOutputMetadata({
          type: 'seo_analysis',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('SEO analysis completed!');
      } else {
        toast.error('Failed to analyze content');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to analyze content');
    },
  });

  const optimizeKeywordsMutation = trpc.agents.seo.optimizeKeywords.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.optimizedContent || 'Keywords optimized successfully!');
        setOutputMetadata({
          type: 'keyword_optimization',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Keywords optimized successfully!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to optimize keywords');
    },
  });

  const generateMetaTagsMutation = trpc.agents.seo.generateMetaTags.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.metaTags || 'Meta tags generated successfully!');
        setOutputMetadata({
          type: 'meta_tags',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Meta tags generated successfully!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate meta tags');
    },
  });

  const recommendKeywordsMutation = trpc.agents.seo.recommendKeywords.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.recommendations || 'Keyword recommendations generated successfully!');
        setOutputMetadata({
          type: 'keyword_recommendations',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Keyword recommendations generated!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate keyword recommendations');
    },
  });

  const generateSchemaMutation = trpc.agents.seo.generateSchema.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.schema || 'Schema markup generated successfully!');
        setOutputMetadata({
          type: 'schema_markup',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Schema markup generated!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate schema markup');
    },
  });

  const auditTechnicalSEOMutation = trpc.agents.seo.auditTechnicalSEO.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.auditReport || 'Technical SEO audit completed successfully!');
        setOutputMetadata({
          type: 'technical_audit',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Technical SEO audit completed!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to complete SEO audit');
    },
  });

  const isLoading = analyzeContentMutation.isLoading || 
                   optimizeKeywordsMutation.isLoading || 
                   generateMetaTagsMutation.isLoading || 
                   recommendKeywordsMutation.isLoading ||
                   generateSchemaMutation.isLoading ||
                   auditTechnicalSEOMutation.isLoading;

  const error = analyzeContentMutation.error?.message ||
                optimizeKeywordsMutation.error?.message ||
                generateMetaTagsMutation.error?.message ||
                recommendKeywordsMutation.error?.message ||
                generateSchemaMutation.error?.message ||
                auditTechnicalSEOMutation.error?.message;

  const status = isLoading ? 'running' : error ? 'error' : output ? 'success' : 'idle';

  const onAnalysisSubmit = async (data: SEOContentAnalysisData) => {
    const formDataWithKeywords = {
      ...data,
      targetKeywords: keywords.length > 0 ? keywords : ['seo', 'content'],
    };
    await analyzeContentMutation.mutateAsync(formDataWithKeywords);
  };

  const onOptimizeSubmit = async (data: SEOContentAnalysisData) => {
    const formDataWithKeywords = {
      ...data,
      targetKeywords: keywords.length > 0 ? keywords : ['seo', 'content'],
    };
    await optimizeKeywordsMutation.mutateAsync(formDataWithKeywords);
  };

  const onMetaTagsSubmit = async (data: SEOMetaTagsData) => {
    const formDataWithKeywords = {
      ...data,
      keywords: keywords.length > 0 ? keywords : undefined,
    };
    await generateMetaTagsMutation.mutateAsync(formDataWithKeywords);
  };

  const onKeywordSubmit = async (data: SEOKeywordRecommendationData) => {
    await recommendKeywordsMutation.mutateAsync(data);
  };

  const onSchemaSubmit = async (data: SEOContentAnalysisData) => {
    const formDataWithKeywords = {
      ...data,
      targetKeywords: keywords.length > 0 ? keywords : ['seo', 'content'],
    };
    await generateSchemaMutation.mutateAsync(formDataWithKeywords);
  };

  const onAuditSubmit = async (data: SEOTechnicalAuditData) => {
    await auditTechnicalSEOMutation.mutateAsync(data);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleReset = () => {
    analysisForm.reset();
    metaTagsForm.reset();
    keywordForm.reset();
    auditForm.reset();
    setKeywords([]);
    setKeywordInput('');
    setOutput('');
    setOutputMetadata(null);
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'analyze':
        return (
          <Form {...analysisForm}>
            <form onSubmit={analysisForm.handleSubmit(onAnalysisSubmit)} className="space-y-6">
              <FormField
                control={analysisForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Content to Analyze</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Paste your content here for SEO analysis..."
                        className="input-neon min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={analysisForm.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-neon">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="blog">Blog Post</SelectItem>
                        <SelectItem value="page">Web Page</SelectItem>
                        <SelectItem value="product">Product Page</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={analysisForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Title (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Page title"
                          className="input-neon"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={analysisForm.control}
                  name="focusKeyword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Focus Keyword</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Primary keyword"
                          className="input-neon"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Keywords Section */}
              <div className="space-y-2">
                <Label className="text-white flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <span>Target Keywords</span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Add target keywords"
                    className="input-neon flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button
                    type="button"
                    onClick={addKeyword}
                    className="btn-neon"
                    disabled={!keywordInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-500/20"
                        onClick={() => removeKeyword(keyword)}
                      >
                        {keyword} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-neon-blue"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze SEO'}
                </Button>
                <Button
                  type="button"
                  onClick={analysisForm.handleSubmit(onOptimizeSubmit)}
                  disabled={isLoading}
                  className="flex-1 btn-neon-green"
                >
                  {isLoading ? 'Optimizing...' : 'Optimize Keywords'}
                </Button>
              </div>
            </form>
          </Form>
        );

      case 'meta':
        return (
          <Form {...metaTagsForm}>
            <form onSubmit={metaTagsForm.handleSubmit(onMetaTagsSubmit)} className="space-y-6">
              <FormField
                control={metaTagsForm.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center space-x-2">
                      <Tag className="h-4 w-4" />
                      <span>Topic</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Digital marketing strategies"
                        className="input-neon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={metaTagsForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Content</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Paste your content here to generate meta tags..."
                        className="input-neon min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={metaTagsForm.control}
                name="businessContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Business Context (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., SaaS company, e-commerce store"
                        className="input-neon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-neon-purple"
              >
                {isLoading ? 'Generating...' : 'Generate Meta Tags'}
              </Button>
            </form>
          </Form>
        );

      case 'keywords':
        return (
          <Form {...keywordForm}>
            <form onSubmit={keywordForm.handleSubmit(onKeywordSubmit)} className="space-y-6">
              <FormField
                control={keywordForm.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>Topic</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., AI-powered marketing tools"
                        className="input-neon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={keywordForm.control}
                name="businessContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Business Context (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your business, industry, and target audience..."
                        className="input-neon min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-neon-green"
              >
                {isLoading ? 'Generating...' : 'Get Keyword Recommendations'}
              </Button>
            </form>
          </Form>
        );

      case 'schema':
        return (
          <Form {...analysisForm}>
            <form onSubmit={analysisForm.handleSubmit(onSchemaSubmit)} className="space-y-6">
              <div className="text-sm text-gray-400 mb-4">
                Generate structured data markup for better search engine understanding.
              </div>
              
              <FormField
                control={analysisForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Content</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Paste your content here to generate schema markup..."
                        className="input-neon min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={analysisForm.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-neon">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="blog">Blog Post</SelectItem>
                        <SelectItem value="page">Web Page</SelectItem>
                        <SelectItem value="product">Product Page</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-neon-pink"
              >
                {isLoading ? 'Generating...' : 'Generate Schema Markup'}
              </Button>
            </form>
          </Form>
        );

      case 'audit':
        return (
          <Form {...auditForm}>
            <form onSubmit={auditForm.handleSubmit(onAuditSubmit)} className="space-y-6">
              <FormField
                control={auditForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>Website URL</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://example.com"
                        className="input-neon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={auditForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Page Content</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Paste the HTML or text content of the page..."
                        className="input-neon min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-neon"
              >
                {isLoading ? 'Auditing...' : 'Run Technical SEO Audit'}
              </Button>
            </form>
          </Form>
        );

      default:
        return null;
    }
  };

  return (
    <AgentPanel
      title="SEO Agent"
      description="Optimize your content for search engines with comprehensive SEO analysis and recommendations"
      icon={Search}
      status={status}
      isLoading={isLoading}
      error={error}
      onReset={handleReset}
      output={
        <AgentOutput
          content={output}
          isLoading={isLoading}
          title="SEO Analysis Results"
          metadata={outputMetadata}
          showTypingAnimation={true}
        />
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="meta">Meta Tags</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze">
          {renderForm()}
        </TabsContent>
        
        <TabsContent value="meta">
          {renderForm()}
        </TabsContent>
        
        <TabsContent value="keywords">
          {renderForm()}
        </TabsContent>
        
        <TabsContent value="schema">
          {renderForm()}
        </TabsContent>
        
        <TabsContent value="audit">
          {renderForm()}
        </TabsContent>
      </Tabs>
    </AgentPanel>
  );
} 