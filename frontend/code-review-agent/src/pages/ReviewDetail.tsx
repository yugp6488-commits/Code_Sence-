import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetReview, useSubmitFeedback, getGetReviewQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, XCircle, Shield, Zap, Palette, Cpu, CheckSquare, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { motion } from "framer-motion";
import mermaid from "mermaid";
import { cn } from "@/lib/utils";

type Suggestion = {
  id: number;
  reviewId: number;
  category: string;
  severity: string;
  lineStart?: number | null;
  lineEnd?: number | null;
  message: string;
  suggestedCode?: string | null;
  explanation: string;
  feedback?: string | null;
  feedbackNote?: string | null;
  createdAt: string;
};

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, React.ReactNode> = {
    security: <Shield className="w-4 h-4" />,
    performance: <Zap className="w-4 h-4" />,
    style: <Palette className="w-4 h-4" />,
    logic: <Cpu className="w-4 h-4" />,
    "best-practice": <CheckSquare className="w-4 h-4" />,
  };
  return icons[category] ?? <CheckSquare className="w-4 h-4" />;
}

function SeverityBadge({ severity }: { severity: string }) {
  const classes: Record<string, string> = {
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${classes[severity] ?? "bg-muted text-muted-foreground border-border"}`}>
      {severity}
    </span>
  );
}

function SuggestionCard({ suggestion, reviewId, onFeedback }: { suggestion: Suggestion; reviewId: number; onFeedback: (id: number, feedback: "accepted" | "rejected") => void }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  function copyCode() {
    if (suggestion.suggestedCode) {
      navigator.clipboard.writeText(suggestion.suggestedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      id={`suggestion-${suggestion.id}`}
    >
      <Card
        data-testid={`card-suggestion-${suggestion.id}`}
        className={cn(
          "border-l-4 transition-colors",
          suggestion.feedback === "accepted" && "border-l-green-500 bg-green-500/5",
          suggestion.feedback === "rejected" && "border-l-destructive bg-destructive/5",
          !suggestion.feedback && suggestion.severity === "critical" && "border-l-red-500",
          !suggestion.feedback && suggestion.severity === "warning" && "border-l-amber-500",
          !suggestion.feedback && suggestion.severity === "info" && "border-l-blue-500",
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              <span className="text-muted-foreground"><CategoryIcon category={suggestion.category} /></span>
              <span className="font-medium text-sm">{suggestion.message}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SeverityBadge severity={suggestion.severity} />
              {suggestion.lineStart && (
                <span className="text-xs text-muted-foreground font-mono">L{suggestion.lineStart}{suggestion.lineEnd && suggestion.lineEnd !== suggestion.lineStart ? `–${suggestion.lineEnd}` : ""}</span>
              )}
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-3 pt-0">
            <p className="text-sm text-muted-foreground">{suggestion.explanation}</p>

            {suggestion.suggestedCode && (
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-medium">Suggested fix</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={copyCode}>
                    <Copy className="w-3 h-3" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words">
                  {suggestion.suggestedCode}
                </pre>
              </div>
            )}

            {!suggestion.feedback ? (
              <div className="flex items-center gap-2 pt-1">
                <Button
                  data-testid={`button-accept-${suggestion.id}`}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 hover:border-green-500 hover:text-green-500 hover:bg-green-500/10"
                  onClick={() => onFeedback(suggestion.id, "accepted")}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accept
                </Button>
                <Button
                  data-testid={`button-reject-${suggestion.id}`}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 hover:border-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onFeedback(suggestion.id, "rejected")}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className={cn(
                "flex items-center gap-1.5 text-sm font-medium",
                suggestion.feedback === "accepted" ? "text-green-500" : "text-destructive"
              )}>
                {suggestion.feedback === "accepted" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {suggestion.feedback === "accepted" ? "Accepted — agent will remember this pattern" : "Rejected — agent will deprioritize this pattern"}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

type ExplainResponse = {
  explanation: string;
  codeFlowMermaid: string;
  mindMapMermaid: string;
};

function MermaidChart({ chart }: { chart: string }) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    const target = chartRef.current;
    target.innerHTML = "";
    setRenderError(null);

    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        flowchart: { useMaxWidth: true },
      });

      const chartId = `mermaid-${Math.random().toString(36).slice(2)}`;
      mermaid.render(chartId, chart, (svgCode) => {
        target.innerHTML = svgCode;
      });
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : String(err));
    }
  }, [chart]);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/90 p-4 min-h-[260px]">
      {renderError ? (
        <pre className="text-sm text-destructive whitespace-pre-wrap">{renderError}</pre>
      ) : (
        <div ref={chartRef} className="min-h-[220px] w-full" />
      )}
    </div>
  );
}

export default function ReviewDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reviewId = parseInt(id ?? "0");
  const { data: review, isLoading } = useGetReview(reviewId, {
    query: { enabled: !!reviewId, queryKey: getGetReviewQueryKey(reviewId) },
  });
  const submitFeedback = useSubmitFeedback();
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explanationData, setExplanationData] = useState<ExplainResponse | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [visualMode, setVisualMode] = useState<"flow" | "mindmap">("flow");

  async function handleExplainCode() {
    if (!reviewId) {
      return;
    }

    setExplainOpen(true);
    if (explanationData || explainLoading) {
      return;
    }

    setExplainError(null);
    setExplainLoading(true);

    try {
      const response = await fetch(`/api/reviews/${reviewId}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const payload = (await response.json()) as ExplainResponse;
      setExplanationData(payload);
    } catch (error) {
      setExplainError(error instanceof Error ? error.message : "Failed to generate explanation.");
    } finally {
      setExplainLoading(false);
    }
  }

  function handleFeedback(suggestionId: number, feedback: "accepted" | "rejected") {
    submitFeedback.mutate(
      { id: reviewId, data: { suggestionId, feedback } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetReviewQueryKey(reviewId) });
          toast({
            title: feedback === "accepted" ? "Suggestion accepted" : "Suggestion rejected",
            description: "The agent has updated its memory patterns.",
          });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to submit feedback.", variant: "destructive" });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Review not found.</p>
        <Button className="mt-4" onClick={() => setLocation("/reviews")}>Back to reviews</Button>
      </div>
    );
  }

  const accepted = review.suggestions.filter((s) => s.feedback === "accepted").length;
  const rejected = review.suggestions.filter((s) => s.feedback === "rejected").length;
  const pending = review.suggestions.filter((s) => !s.feedback).length;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button data-testid="button-back" variant="ghost" size="sm" className="gap-1.5" onClick={() => setLocation("/reviews")}>
          <ArrowLeft className="w-4 h-4" />
          Reviews
        </Button>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{review.title}</h1>
          <span className="text-xs px-2 py-0.5 rounded border font-mono font-medium bg-blue-500/10 text-blue-500 border-blue-500/20">
            {review.language}
          </span>
          {review.projectName && (
            <span className="text-sm text-muted-foreground">in {review.projectName}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(review.createdAt).toLocaleString()} ·{" "}
          <span className="text-green-500">{accepted} accepted</span>
          {rejected > 0 && <span className="text-destructive"> · {rejected} rejected</span>}
          {pending > 0 && <span> · {pending} pending</span>}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Submitted Code</CardTitle>
        </CardHeader>
        <CardContent>
          <pre data-testid="code-block" className="bg-muted rounded-md p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
            {review.code}
          </pre>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {review.suggestions.length} Suggestion{review.suggestions.length !== 1 ? "s" : ""}
          </h2>
          <Dialog open={explainOpen} onOpenChange={setExplainOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={handleExplainCode}
              >
                <Cpu className="w-4 h-4" />
                Explain Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl w-[min(100%,80rem)] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Explain Code & Visualize Flow</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {explainLoading && (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/90 p-5">
                    <Spinner className="h-5 w-5 text-blue-400" />
                    <p className="text-sm text-muted-foreground">Generating a step-by-step explanation and visualization...</p>
                  </div>
                )}

                {explainError && (
                  <Card className="border border-destructive/30 bg-destructive/5">
                    <CardContent className="text-sm text-destructive">{explainError}</CardContent>
                  </Card>
                )}

                {explanationData ? (
                  <div className="space-y-4">
                    <Accordion type="single" collapsible defaultValue="explanation" className="rounded-2xl border border-slate-700 bg-slate-950/90 p-4">
                      <AccordionItem value="explanation">
                        <AccordionTrigger className="text-sm font-medium text-foreground">Explanation</AccordionTrigger>
                        <AccordionContent>
                          <p className="mt-3 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
                            {explanationData.explanation}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="rounded-2xl border border-slate-700 bg-slate-950/90 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Visualization</p>
                          <p className="text-xs text-muted-foreground">Switch between the generated execution flow and architecture map.</p>
                        </div>
                        <ToggleGroup type="single" value={visualMode} onValueChange={(value) => setVisualMode(value as "flow" | "mindmap") } aria-label="Visualization mode">
                          <ToggleGroupItem value="flow">Code Flow</ToggleGroupItem>
                          <ToggleGroupItem value="mindmap">Mind Map</ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                      <div className="mt-4">
                        <MermaidChart chart={visualMode === "flow" ? explanationData.codeFlowMermaid : explanationData.mindMapMermaid} />
                      </div>
                    </div>
                  </div>
                ) : (
                  !explainLoading && (
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/90 p-5 text-sm text-muted-foreground">
                      Click "Explain Code" to generate a plain-English walkthrough and Mermaid visualization for this review.
                    </div>
                  )
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {review.suggestions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500 opacity-60" />
              <p>No issues found. The code looks good!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {review.suggestions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <SuggestionCard suggestion={s} reviewId={reviewId} onFeedback={handleFeedback} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
