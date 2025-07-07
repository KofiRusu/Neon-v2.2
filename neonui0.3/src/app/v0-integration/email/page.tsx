'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Sparkles, Users, Target, BarChart3, Zap, Hash, Globe } from 'lucide-react';
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
import { Slider } from '@/components/ui/slider';
import AgentPanel from '@/components/ui/AgentPanel';
import AgentOutput from '@/components/ui/AgentOutput';

import { trpc } from '@/utils/trpc';

// Zod schemas for different email tasks
const EmailSequenceSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic must be less than 200 characters'),
  audience: z.string().min(1, 'Audience is required').max(200, 'Audience must be less than 200 characters'),
  businessType: z.string().optional(),
  sequenceLength: z.number().min(1).max(10).default(3),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent'], {
    required_error: 'Please select a tone',
  }),
  goals: z.array(z.string()).optional(),
  industry: z.string().optional(),
});

const EmailPersonalizationSchema = z.object({
  baseEmail: z.string().min(1, 'Base email content is required').max(10000, 'Content must be less than 10,000 characters'),
  userTraits: z.record(z.any()),
  segmentData: z.object({
    segment: z.string(),
    characteristics: z.array(z.string()),
    preferences: z.array(z.string()).optional(),
  }).optional(),
  businessContext: z.string().optional(),
});

const EmailPerformanceSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  sent: z.number().min(0),
  delivered: z.number().min(0),
  opens: z.number().min(0),
  clicks: z.number().min(0),
  conversions: z.number().min(0).optional(),
  unsubscribes: z.number().min(0).optional(),
  bounces: z.number().min(0).optional(),
  complaints: z.number().min(0).optional(),
  timeRange: z.string().default('30d'),
});

const SubjectLineSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic must be less than 200 characters'),
  audience: z.string().min(1, 'Audience is required').max(200, 'Audience must be less than 200 characters'),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent']).default('professional'),
  count: z.number().min(1).max(20).default(5),
});

const NewsletterSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(200, 'Topic must be less than 200 characters'),
  audience: z.string().min(1, 'Audience is required').max(200, 'Audience must be less than 200 characters'),
  sections: z.array(z.string()).optional(),
  tone: z.enum(['professional', 'casual', 'friendly']).default('professional'),
});

type EmailSequenceData = z.infer<typeof EmailSequenceSchema>;
type EmailPersonalizationData = z.infer<typeof EmailPersonalizationSchema>;
type EmailPerformanceData = z.infer<typeof EmailPerformanceSchema>;
type SubjectLineData = z.infer<typeof SubjectLineSchema>;
type NewsletterData = z.infer<typeof NewsletterSchema>;

export default function EmailAgentPage() {
  const [activeTab, setActiveTab] = useState('sequence');
  const [goalInput, setGoalInput] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [sectionInput, setSectionInput] = useState('');
  const [sections, setSections] = useState<string[]>([]);
  const [output, setOutput] = useState('');
  const [outputMetadata, setOutputMetadata] = useState<any>(null);

  // Multiple forms for different tabs
  const sequenceForm = useForm<EmailSequenceData>({
    resolver: zodResolver(EmailSequenceSchema),
    defaultValues: {
      topic: '',
      audience: '',
      businessType: '',
      sequenceLength: 3,
      tone: 'professional',
      goals: [],
      industry: '',
    },
  });

  const personalizationForm = useForm<EmailPersonalizationData>({
    resolver: zodResolver(EmailPersonalizationSchema),
    defaultValues: {
      baseEmail: '',
      userTraits: {},
      segmentData: {
        segment: '',
        characteristics: [],
        preferences: [],
      },
      businessContext: '',
    },
  });

  const performanceForm = useForm<EmailPerformanceData>({
    resolver: zodResolver(EmailPerformanceSchema),
    defaultValues: {
      campaignId: '',
      sent: 0,
      delivered: 0,
      opens: 0,
      clicks: 0,
      conversions: 0,
      unsubscribes: 0,
      bounces: 0,
      complaints: 0,
      timeRange: '30d',
    },
  });

  const subjectLineForm = useForm<SubjectLineData>({
    resolver: zodResolver(SubjectLineSchema),
    defaultValues: {
      topic: '',
      audience: '',
      tone: 'professional',
      count: 5,
    },
  });

  const newsletterForm = useForm<NewsletterData>({
    resolver: zodResolver(NewsletterSchema),
    defaultValues: {
      topic: '',
      audience: '',
      sections: [],
      tone: 'professional',
    },
  });

  // tRPC mutations
  const generateSequenceMutation = trpc.agents.email.generateSequence.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.sequence || 'Email sequence generated successfully!');
        setOutputMetadata({
          type: 'email_sequence',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Email sequence generated successfully!');
      } else {
        toast.error('Failed to generate email sequence');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate email sequence');
    },
  });

  const personalizeEmailMutation = trpc.agents.email.personalizeEmail.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.personalizedEmail || 'Email personalized successfully!');
        setOutputMetadata({
          type: 'email_personalization',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Email personalized successfully!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to personalize email');
    },
  });

  const analyzePerformanceMutation = trpc.agents.email.analyzePerformance.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.analysis || 'Performance analysis completed successfully!');
        setOutputMetadata({
          type: 'performance_analysis',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Performance analysis completed!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to analyze performance');
    },
  });

  const generateSubjectLinesMutation = trpc.agents.email.generateSubjectLines.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.subjectLines || 'Subject lines generated successfully!');
        setOutputMetadata({
          type: 'subject_lines',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Subject lines generated!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate subject lines');
    },
  });

  const createNewsletterMutation = trpc.agents.email.createNewsletter.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        setOutput(data.data.newsletter || 'Newsletter created successfully!');
        setOutputMetadata({
          type: 'newsletter',
          tokens: data.data.metadata?.tokens,
          executionTime: data.performance?.executionTime,
          confidence: data.data.metadata?.confidence,
        });
        toast.success('Newsletter created successfully!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create newsletter');
    },
  });

  const isLoading = generateSequenceMutation.isLoading || 
                   personalizeEmailMutation.isLoading || 
                   analyzePerformanceMutation.isLoading || 
                   generateSubjectLinesMutation.isLoading ||
                   createNewsletterMutation.isLoading;

  const error = generateSequenceMutation.error?.message ||
                personalizeEmailMutation.error?.message ||
                analyzePerformanceMutation.error?.message ||
                generateSubjectLinesMutation.error?.message ||
                createNewsletterMutation.error?.message;

  const status = isLoading ? 'running' : error ? 'error' : output ? 'success' : 'idle';

  const onSequenceSubmit = async (data: EmailSequenceData) => {
    const formDataWithGoals = {
      ...data,
      goals: goals.length > 0 ? goals : undefined,
    };
    await generateSequenceMutation.mutateAsync(formDataWithGoals);
  };

  const onPersonalizationSubmit = async (data: EmailPersonalizationData) => {
    await personalizeEmailMutation.mutateAsync(data);
  };

  const onPerformanceSubmit = async (data: EmailPerformanceData) => {
    await analyzePerformanceMutation.mutateAsync(data);
  };

  const onSubjectLineSubmit = async (data: SubjectLineData) => {
    await generateSubjectLinesMutation.mutateAsync(data);
  };

  const onNewsletterSubmit = async (data: NewsletterData) => {
    const formDataWithSections = {
      ...data,
      sections: sections.length > 0 ? sections : undefined,
    };
    await createNewsletterMutation.mutateAsync(formDataWithSections);
  };

  const addGoal = () => {
    if (goalInput.trim() && !goals.includes(goalInput.trim())) {
      setGoals([...goals, goalInput.trim()]);
      setGoalInput('');
    }
  };

  const removeGoal = (goal: string) => {
    setGoals(goals.filter(g => g !== goal));
  };

  const addSection = () => {
    if (sectionInput.trim() && !sections.includes(sectionInput.trim())) {
      setSections([...sections, sectionInput.trim()]);
      setSectionInput('');
    }
  };

  const removeSection = (section: string) => {
    setSections(sections.filter(s => s !== section));
  };

  const handleReset = () => {
    sequenceForm.reset();
    personalizationForm.reset();
    performanceForm.reset();
    subjectLineForm.reset();
    newsletterForm.reset();
    setGoals([]);
    setGoalInput('');
    setSections([]);
    setSectionInput('');
    setOutput('');
    setOutputMetadata(null);
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'sequence':
        return (
          <Form {...sequenceForm}>
            <form onSubmit={sequenceForm.handleSubmit(onSequenceSubmit)} className="space-y-6">
              <FormField
                control={sequenceForm.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>Email Topic</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Welcome new customers to our SaaS platform"
                        className="input-neon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={sequenceForm.control}
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
                        placeholder="e.g., New SaaS users, startup founders"
                        className="input-neon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={sequenceForm.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Business Type (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., SaaS, e-commerce, consulting"
                          className="input-neon"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sequenceForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Industry (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Technology, healthcare, finance"
                          className="input-neon"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={sequenceForm.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email Tone</FormLabel>
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
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={sequenceForm.control}
                name="sequenceLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">
                      Sequence Length: {field.value} emails
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Goals Section */}
              <div className="space-y-2">
                <Label className="text-white flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <span>Campaign Goals (Optional)</span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="Add campaign goals"
                    className="input-neon flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                  />
                  <Button
                    type="button"
                    onClick={addGoal}
                    className="btn-neon"
                    disabled={!goalInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {goals.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {goals.map((goal, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-500/20"
                        onClick={() => removeGoal(goal)}
                      >
                        {goal} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-neon-blue"
              >
                {isLoading ? 'Generating...' : 'Generate Email Sequence'}
              </Button>
            </form>
          </Form>
        );

      case 'personalization':
        return (
          <Form {...personalizationForm}>
            <form onSubmit={personalizationForm.handleSubmit(onPersonalizationSubmit)} className="space-y-6">
              <FormField
                control={personalizationForm.control}
                name="baseEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Base Email Content</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Paste your base email content here for personalization..."
                        className="input-neon min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalizationForm.control}
                name="segmentData.segment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Target Segment</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Enterprise customers, free trial users"
                        className="input-neon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={personalizationForm.control}
                name="businessContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Business Context (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your business and any specific context for personalization..."
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
                className="w-full btn-neon-purple"
              >
                {isLoading ? 'Personalizing...' : 'Personalize Email'}
              </Button>
            </form>
          </Form>
        );

      case 'performance':
        return (
          <Form {...performanceForm}>
            <form onSubmit={performanceForm.handleSubmit(onPerformanceSubmit)} className="space-y-6">
              <FormField
                control={performanceForm.control}
                name="campaignId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Campaign ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., campaign-2024-001"
                        className="input-neon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={performanceForm.control}
                  name="sent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Emails Sent</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="10000"
                          className="input-neon"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={performanceForm.control}
                  name="delivered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Delivered</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="9500"
                          className="input-neon"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={performanceForm.control}
                  name="opens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Opens</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="2400"
                          className="input-neon"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={performanceForm.control}
                  name="clicks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Clicks</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="480"
                          className="input-neon"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={performanceForm.control}
                  name="conversions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Conversions</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="96"
                          className="input-neon"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={performanceForm.control}
                  name="unsubscribes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Unsubscribes</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="25"
                          className="input-neon"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={performanceForm.control}
                name="timeRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Analysis Time Range</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-neon">
                          <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-neon-green"
              >
                {isLoading ? 'Analyzing...' : 'Analyze Performance'}
              </Button>
            </form>
          </Form>
        );

      case 'subjects':
        return (
          <Form {...subjectLineForm}>
            <form onSubmit={subjectLineForm.handleSubmit(onSubjectLineSubmit)} className="space-y-6">
              <FormField
                control={subjectLineForm.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email Topic</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Product launch announcement"
                        className="input-neon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={subjectLineForm.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Target Audience</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Existing customers, prospects"
                        className="input-neon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={subjectLineForm.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Tone</FormLabel>
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
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={subjectLineForm.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">
                      Number of Subject Lines: {field.value}
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={20}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-neon-pink"
              >
                {isLoading ? 'Generating...' : 'Generate Subject Lines'}
              </Button>
            </form>
          </Form>
        );

      case 'newsletter':
        return (
          <Form {...newsletterForm}>
            <form onSubmit={newsletterForm.handleSubmit(onNewsletterSubmit)} className="space-y-6">
              <FormField
                control={newsletterForm.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Newsletter Topic</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Monthly tech updates and insights"
                        className="input-neon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newsletterForm.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Target Audience</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Tech professionals, developers"
                        className="input-neon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newsletterForm.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Newsletter Tone</FormLabel>
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Newsletter Sections */}
              <div className="space-y-2">
                <Label className="text-white flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <span>Newsletter Sections (Optional)</span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    value={sectionInput}
                    onChange={(e) => setSectionInput(e.target.value)}
                    placeholder="Add newsletter sections"
                    className="input-neon flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSection())}
                  />
                  <Button
                    type="button"
                    onClick={addSection}
                    className="btn-neon"
                    disabled={!sectionInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {sections.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sections.map((section, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-500/20"
                        onClick={() => removeSection(section)}
                      >
                        {section} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-neon"
              >
                {isLoading ? 'Creating...' : 'Create Newsletter'}
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
      title="Email Agent"
      description="Create powerful email marketing campaigns with AI-driven personalization and optimization"
      icon={Mail}
      status={status}
      isLoading={isLoading}
      error={error}
      onReset={handleReset}
      output={
        <AgentOutput
          content={output}
          isLoading={isLoading}
          title="Email Marketing Results"
          metadata={outputMetadata}
          showTypingAnimation={true}
        />
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="sequence">Sequence</TabsTrigger>
          <TabsTrigger value="personalization">Personalize</TabsTrigger>
          <TabsTrigger value="performance">Analytics</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
        </TabsList>

        <TabsContent value="sequence">
          {renderForm()}
        </TabsContent>
        
        <TabsContent value="personalization">
          {renderForm()}
        </TabsContent>
        
        <TabsContent value="performance">
          {renderForm()}
        </TabsContent>
        
        <TabsContent value="subjects">
          {renderForm()}
        </TabsContent>
        
        <TabsContent value="newsletter">
          {renderForm()}
        </TabsContent>
      </Tabs>
    </AgentPanel>
  );
} 