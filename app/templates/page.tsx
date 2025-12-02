'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Download, Tag } from 'lucide-react';
import { WORKFLOW_TEMPLATES, templateToWorkflow } from '@/lib/workflow-templates';
import axios from 'axios';

export default function TemplatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const useTemplate = async (templateId: string) => {
    setLoading(templateId);
    try {
      const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        alert('Template not found');
        return;
      }

      // Convert template to workflow with new ID
      const workflow = templateToWorkflow(template);

      // Save workflow
      await axios.post('/api/workflows', workflow);

      // Redirect to editor
      router.push(`/workflows/${workflow.id}`);
    } catch (error) {
      console.error('Failed to use template:', error);
      alert('Failed to load template');
    } finally {
      setLoading(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-blue-100 text-blue-700';
      case 'advanced': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Workflow Templates</h1>
          </div>
          <p className="text-muted-foreground">
            Start with pre-built workflows and customize them for your needs
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WORKFLOW_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-border p-6 hover:shadow-xl transition-shadow"
            >
              {/* Category Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(template.category)}`}>
                  {template.category}
                </span>
                <div className="text-sm text-muted-foreground">
                  {template.workflow.nodes.length} nodes
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {template.description}
              </p>

              {/* Tags */}
              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Use Template Button */}
              <button
                onClick={() => useTemplate(template.id)}
                disabled={loading === template.id}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
              >
                {loading === template.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Use This Template
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center p-8 bg-white rounded-xl border border-border">
          <h3 className="text-xl font-semibold mb-2">Want to create your own?</h3>
          <p className="text-muted-foreground mb-6">
            Start from scratch and build custom workflows tailored to your needs
          </p>
          <Link
            href="/workflows/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Sparkles className="w-5 h-5" />
            Create Custom Workflow
          </Link>
        </div>
      </div>
    </div>
  );
}

