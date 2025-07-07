'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Code, Sparkles, Tag, Users, Palette, Hash } from 'lucide-react';
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

// Zod schema for content generation
const ContentGenerationSchema = z.object({
  type: z.enum(['blog', 'social_post', 'email', 'caption', 'copy'], {
    required_error: 'Please select a content type',
  }),
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic must be less than 200 characters'),
  audience: z.string().min(1, 'Audience is required').max(200, 'Audience must be less than 200 characters'),
  tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'playful'], {
    required_error: 'Please select a tone',
  }),
  keywords: z.array(z.string()).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'email']).optional(),
});

type ContentGenerationData = z.infer<typeof ContentGenerationSchema>;

export default function ContentAgentPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [output, setOutput] = useState('');
  const [outputMetadata, setOutputMetadata] = useState<any>(null);

  const form = useForm<ContentGenerationData>({
    resolver: zodResolver(ContentGenerationSchema),
    defaultValues: {
      type: 'blog',
      topic: '',
      audience: '',
      tone: 'professional',
      keywords: [],
      length: 'medium',
      platform: 'linkedin',
    },
  });

  // tRPC mutations
  const generateContentMutation = trpc.agents.content.generate.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.content || 'Content generated successfully!');
        setOutputMetadata({
          type: data.data.type || 'content',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Content generated successfully!');
      } else {
        toast.error('Failed to generate content');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate content');
    },
  });

  const generateBlogMutation = trpc.agents.content.generateBlog.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.content || 'Blog post generated successfully!');
        setOutputMetadata({
          type: 'blog',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Blog post generated successfully!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate blog post');
    },
  });

  const generatePostMutation = trpc.agents.content.generatePost.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.content || 'Social post generated successfully!');
        setOutputMetadata({
          type: 'social_post',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Social post generated successfully!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate social post');
    },
  });

  const generateCaptionMutation = trpc.agents.content.generateCaption.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.content || 'Caption generated successfully!');
        setOutputMetadata({
          type: 'caption',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Caption generated successfully!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate caption');
    },
  });

  const isLoading = generateContentMutation.isLoading || 
                   generateBlogMutation.isLoading || 
                   generatePostMutation.isLoading || 
                   generateCaptionMutation.isLoading;

  const error = generateContentMutation.error?.message ||
                generateBlogMutation.error?.message ||
                generatePostMutation.error?.message ||
                generateCaptionMutation.error?.message;

  const status = isLoading ? 'running' : error ? 'error' : output ? 'success' : 'idle';

  const onSubmit = async (data: ContentGenerationData) => {
    const formDataWithKeywords = {
      ...data,
      keywords: keywords.length > 0 ? keywords : undefined,
    };

    switch (activeTab) {
      case 'general':
        await generateContentMutation.mutateAsync(formDataWithKeywords);
        break;
      case 'blog':
        await generateBlogMutation.mutateAsync(formDataWithKeywords);
        break;
      case 'social':
        await generatePostMutation.mutateAsync(formDataWithKeywords);
        break;
      case 'caption':
        await generateCaptionMutation.mutateAsync(formDataWithKeywords);
        break;
    }
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
    form.reset();
    setKeywords([]);
    setKeywordInput('');
    setOutput('');
    setOutputMetadata(null);
  };

  const renderForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="blog">Blog Post</TabsTrigger>
            <TabsTrigger value="social">Social Post</TabsTrigger>
            <TabsTrigger value="caption">Caption</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <FormField
              control={form.control}
              name="type"
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
                      <SelectItem value="social_post">Social Media Post</SelectItem>
                      <SelectItem value="email">Email Content</SelectItem>
                      <SelectItem value="caption">Image Caption</SelectItem>
                      <SelectItem value="copy">Marketing Copy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="blog" className="space-y-4">
            <div className="text-sm text-gray-400 mb-4">
              Generate comprehensive blog posts with SEO optimization and engaging content structure.
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="text-sm text-gray-400 mb-4">
              Create engaging social media posts optimized for various platforms.
            </div>
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Platform</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="input-neon">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="caption" className="space-y-4">
            <div className="text-sm text-gray-400 mb-4">
              Generate catchy captions for images and visual content.
            </div>
          </TabsContent>
        </Tabs>

        {/* Common Fields */}
        <div className="space-y-4">
          <FormField
            control={form.control}
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
                    placeholder="e.g., Digital marketing trends for 2024"
                    className="input-neon"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="audience"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Target Audience</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Small business owners and marketing professionals"
                    className="input-neon"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Tone</span>
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="input-neon">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Content Length</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="input-neon">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="short">Short (100-300 words)</SelectItem>
                    <SelectItem value="medium">Medium (300-800 words)</SelectItem>
                    <SelectItem value="long">Long (800+ words)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Keywords */}
          <div className="space-y-2">
            <Label className="text-white flex items-center space-x-2">
              <Hash className="h-4 w-4" />
              <span>Keywords (Optional)</span>
            </Label>
            <div className="flex space-x-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keywords"
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
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full btn-neon-purple"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Generating Content...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Content
            </>
          )}
        </Button>
      </form>
    </Form>
  );

  return (
    <AgentPanel
      title="Content Agent"
      description="Generate high-quality content for blogs, social media, and marketing materials"
      icon={Code}
      status={status}
      isLoading={isLoading}
      error={error}
      onReset={handleReset}
      output={
        <AgentOutput
          content={output}
          isLoading={isLoading}
          title="Generated Content"
          metadata={outputMetadata}
          showTypingAnimation={true}
        />
      }
    >
      {renderForm()}
    </AgentPanel>
  );
} 