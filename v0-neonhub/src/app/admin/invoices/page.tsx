'use client';

import React, { useState } from 'react';
import { api } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  Mail,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface InvoiceRecord {
  id: string;
  month: string;
  totalCost: number;
  totalExecutions: number;
  pdfPath?: string;
  csvPath?: string;
  generatedAt: Date;
  status: 'generating' | 'ready' | 'failed';
}

export default function AdminInvoicesPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM format
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');

  // tRPC queries
  const { data: invoiceHistory, refetch: refetchHistory } = api.billing.getInvoiceHistory.useQuery(
    {}
  );
  const { data: monthlyData } = api.billing.getMonthlySpendSummary.useQuery({
    month: selectedMonth,
  });

  // tRPC mutations
  const generateInvoiceMutation = api.billing.generateInvoice.useMutation({
    onSuccess: () => {
      refetchHistory();
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  const emailInvoiceMutation = api.billing.emailInvoice.useMutation({});

  const handleGenerateInvoice = async () => {
    setIsGenerating(true);
    try {
      await generateInvoiceMutation.mutateAsync({
        month: selectedMonth,
      });
    } catch (error) {
      console.error('Failed to generate invoice:', error);
    }
  };

  const handleEmailInvoice = async (invoiceId: string) => {
    if (!emailRecipient) return;

    try {
      await emailInvoiceMutation.mutateAsync({
        invoiceId,
        recipient: emailRecipient,
      });
    } catch (error) {
      console.error('Failed to email invoice:', error);
    }
  };

  const handleDownload = (filePath: string, filename: string) => {
    // In a real implementation, this would download the file
    // For now, we'll simulate the download
    const link = document.createElement('a');
    link.href = `/api/invoices/download?file=${encodeURIComponent(filePath)}`;
    link.download = filename;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Invoice Management</h1>
            <p className="text-slate-400">
              Generate and manage monthly invoices for AI agent usage
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <Input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* Invoice Generation Card */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate New Invoice
            </CardTitle>
            <CardDescription className="text-slate-400">
              Create PDF and CSV invoices for the selected month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Monthly Summary */}
            {monthlyData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    ${monthlyData.totalSpent?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-slate-400">Total Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {monthlyData.totalExecutions || 0}
                  </div>
                  <div className="text-sm text-slate-400">Total Executions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {monthlyData.campaignBreakdown?.length || 0}
                  </div>
                  <div className="text-sm text-slate-400">Active Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {monthlyData.budgetAmount?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-slate-400">Monthly Budget</div>
                </div>
              </div>
            )}

            {/* Generation Actions */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handleGenerateInvoice}
                disabled={isGenerating || generateInvoiceMutation.isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Generate Invoice
                  </>
                )}
              </Button>

              <div className="text-sm text-slate-400">for {selectedMonth} • PDF & CSV formats</div>
            </div>

            {generateInvoiceMutation.isError && (
              <Alert className="bg-red-900/20 border-red-600">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  Failed to generate invoice. Please check the logs and try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Invoice History */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Invoice History
            </CardTitle>
            <CardDescription className="text-slate-400">
              Previously generated invoices and download options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock invoice history - would come from API */}
              {[
                {
                  id: '1',
                  month: '2024-11',
                  totalCost: 245.67,
                  totalExecutions: 1234,
                  generatedAt: new Date('2024-11-30'),
                  status: 'ready' as const,
                  pdfPath: '/reports/invoices/neonhub_invoice_2024_11.pdf',
                  csvPath: '/reports/invoices/neonhub_invoice_2024_11.csv',
                },
                {
                  id: '2',
                  month: '2024-10',
                  totalCost: 189.34,
                  totalExecutions: 987,
                  generatedAt: new Date('2024-10-31'),
                  status: 'ready' as const,
                  pdfPath: '/reports/invoices/neonhub_invoice_2024_10.pdf',
                  csvPath: '/reports/invoices/neonhub_invoice_2024_10.csv',
                },
                {
                  id: '3',
                  month: '2024-09',
                  totalCost: 156.78,
                  totalExecutions: 756,
                  generatedAt: new Date('2024-09-30'),
                  status: 'ready' as const,
                  pdfPath: '/reports/invoices/neonhub_invoice_2024_09.pdf',
                  csvPath: '/reports/invoices/neonhub_invoice_2024_09.csv',
                },
              ].map(invoice => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Invoice for {invoice.month}</div>
                      <div className="text-sm text-slate-400">
                        Generated {invoice.generatedAt.toLocaleDateString()} • $
                        {invoice.totalCost.toFixed(2)} •{invoice.totalExecutions} executions
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={invoice.status === 'ready' ? 'default' : 'destructive'}
                      className={invoice.status === 'ready' ? 'bg-green-900 text-green-200' : ''}
                    >
                      {invoice.status === 'ready' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {invoice.status}
                        </>
                      )}
                    </Badge>

                    {invoice.status === 'ready' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDownload(invoice.pdfPath!, `invoice_${invoice.month}.pdf`)
                          }
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDownload(invoice.csvPath!, `invoice_${invoice.month}.csv`)
                          }
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-1" />
                          CSV
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {(!invoiceHistory || invoiceHistory.length === 0) && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <div className="text-slate-400 mb-2">No invoices generated yet</div>
                <div className="text-sm text-slate-500">
                  Generate your first invoice using the form above
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription className="text-slate-400">
              Set up automatic invoice delivery via email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-200 mb-2 block">
                  Email Recipient
                </label>
                <Input
                  type="email"
                  value={emailRecipient}
                  onChange={e => setEmailRecipient(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="finance@company.com"
                />
              </div>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                disabled={!emailRecipient}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="text-sm text-slate-400">
                <strong className="text-slate-300">Auto-send Settings:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Invoices will be automatically generated on the 1st of each month</li>
                  <li>PDF and CSV attachments will be included in the email</li>
                  <li>Email delivery confirmation will be logged</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
