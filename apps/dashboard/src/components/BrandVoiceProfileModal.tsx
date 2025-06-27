'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { brand } from '@/lib/brand';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Plus, Lightbulb, Save, Upload } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  keywords: z.array(z.string()),
  tone: z.object({
    professional: z.number().min(0).max(100),
    friendly: z.number().min(0).max(100),
    authoritative: z.number().min(0).max(100),
    casual: z.number().min(0).max(100),
    innovative: z.number().min(0).max(100),
  }),
  vocabulary: z.object({
    preferred: z.array(z.string()),
    prohibited: z.array(z.string()),
    brandTerms: z.array(z.string()),
  }),
  style: z.object({
    sentenceLength: z.enum(['short', 'medium', 'long']),
    readingLevel: z.enum(['elementary', 'middle', 'high-school', 'college']),
    formality: z.enum(['casual', 'semi-formal', 'formal']),
  }),
  sampleContent: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface BrandVoiceProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  profile?: Partial<ProfileFormData>;
}

export function BrandVoiceProfileModal({
  open,
  onOpenChange,
  onSuccess,
  profile,
}: BrandVoiceProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newPreferred, setNewPreferred] = useState('');
  const [newProhibited, setNewProhibited] = useState('');
  const [newBrandTerm, setNewBrandTerm] = useState('');

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || brand.voice.primary,
      description: profile?.description || brand.mission,
      keywords: profile?.keywords || brand.vocabulary.brandTerms,
      tone: {
        professional: profile?.tone?.professional || brand.voice.tone.professional,
        friendly: profile?.tone?.friendly || brand.voice.tone.friendly,
        authoritative: profile?.tone?.authoritative || brand.voice.tone.authoritative,
        casual: profile?.tone?.casual || brand.voice.tone.casual,
        innovative: profile?.tone?.innovative || brand.voice.tone.innovative,
      },
      vocabulary: {
        preferred: profile?.vocabulary?.preferred || brand.vocabulary.preferred,
        prohibited: profile?.vocabulary?.prohibited || brand.vocabulary.prohibited,
        brandTerms: profile?.vocabulary?.brandTerms || brand.vocabulary.brandTerms,
      },
      style: {
        sentenceLength:
          profile?.style?.sentenceLength || (brand.guidelines.style.sentenceLength as any),
        readingLevel: profile?.style?.readingLevel || (brand.guidelines.style.readingLevel as any),
        formality: profile?.style?.formality || (brand.guidelines.style.formality as any),
      },
      sampleContent: profile?.sampleContent || brand.messaging.primaryValue,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // In real implementation, call tRPC mutation
      console.log('Creating profile:', data);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      onSuccess();
    } catch (error) {
      console.error('Failed to create profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addArrayItem = (
    fieldName: keyof Pick<ProfileFormData, 'keywords'> | 'preferred' | 'prohibited' | 'brandTerms',
    value: string,
    setter: (value: string) => void
  ) => {
    if (!value.trim()) return;

    const currentValue = form.getValues();

    if (fieldName === 'keywords') {
      const current = currentValue.keywords || [];
      if (!current.includes(value.trim())) {
        form.setValue('keywords', [...current, value.trim()]);
      }
    } else {
      const current = currentValue.vocabulary[
        fieldName as keyof typeof currentValue.vocabulary
      ] as string[];
      if (!current.includes(value.trim())) {
        form.setValue(`vocabulary.${fieldName}`, [...current, value.trim()]);
      }
    }

    setter('');
  };

  const removeArrayItem = (
    fieldName: keyof Pick<ProfileFormData, 'keywords'> | 'preferred' | 'prohibited' | 'brandTerms',
    index: number
  ) => {
    const currentValue = form.getValues();

    if (fieldName === 'keywords') {
      const current = currentValue.keywords || [];
      form.setValue(
        'keywords',
        current.filter((_, i) => i !== index)
      );
    } else {
      const current = currentValue.vocabulary[
        fieldName as keyof typeof currentValue.vocabulary
      ] as string[];
      form.setValue(
        `vocabulary.${fieldName}`,
        current.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {profile ? 'Edit Brand Voice Profile' : 'Create Brand Voice Profile'}
          </DialogTitle>
          <DialogDescription>
            Define your brand voice characteristics to maintain consistency across all content.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="tone">Tone Profile</TabsTrigger>
                <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
                <TabsTrigger value="sample">Sample Content</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Corporate Professional" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this brand voice profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the characteristics of this brand voice..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description to help identify when to use this profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Keywords</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a keyword..."
                            value={newKeyword}
                            onChange={e => setNewKeyword(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addArrayItem('keywords', newKeyword, setNewKeyword);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addArrayItem('keywords', newKeyword, setNewKeyword)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {field.value?.map((keyword, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {keyword}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeArrayItem('keywords', index)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <FormDescription>
                        Keywords that should appear in content following this voice
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="tone" className="space-y-4">
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    Adjust the sliders to define your brand's tone characteristics. Higher values
                    indicate stronger emphasis.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(form.watch('tone')).map(([toneType, value]) => (
                    <FormField
                      key={toneType}
                      control={form.control}
                      name={`tone.${toneType as keyof ProfileFormData['tone']}`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="capitalize">{toneType}</FormLabel>
                            <span className="text-sm font-medium">{field.value}%</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              value={[field.value]}
                              onValueChange={value => field.onChange(value[0])}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="vocabulary" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Preferred Words */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-green-700">Preferred Words</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add preferred word..."
                          value={newPreferred}
                          onChange={e => setNewPreferred(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addArrayItem('preferred', newPreferred, setNewPreferred);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayItem('preferred', newPreferred, setNewPreferred)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {form.watch('vocabulary.preferred')?.map((word, index) => (
                          <Badge key={index} variant="default" className="flex items-center gap-1">
                            {word}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeArrayItem('preferred', index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prohibited Words */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-700">Prohibited Words</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add prohibited word..."
                          value={newProhibited}
                          onChange={e => setNewProhibited(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addArrayItem('prohibited', newProhibited, setNewProhibited);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            addArrayItem('prohibited', newProhibited, setNewProhibited)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {form.watch('vocabulary.prohibited')?.map((word, index) => (
                          <Badge
                            key={index}
                            variant="destructive"
                            className="flex items-center gap-1"
                          >
                            {word}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeArrayItem('prohibited', index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Brand Terms */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-700">Brand Terms</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add brand term..."
                          value={newBrandTerm}
                          onChange={e => setNewBrandTerm(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addArrayItem('brandTerms', newBrandTerm, setNewBrandTerm);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayItem('brandTerms', newBrandTerm, setNewBrandTerm)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {form.watch('vocabulary.brandTerms')?.map((term, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {term}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeArrayItem('brandTerms', index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="sample" className="space-y-4">
                <FormField
                  control={form.control}
                  name="sampleContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sample Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste some sample content that represents your brand voice..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide sample content to help train the voice analysis. This will improve
                        accuracy for future content.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert>
                  <Upload className="h-4 w-4" />
                  <AlertDescription>
                    You can also upload existing content documents to analyze and extract voice
                    patterns automatically.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {profile ? 'Update Profile' : 'Create Profile'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
