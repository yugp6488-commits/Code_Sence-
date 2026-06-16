import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateReview, useListProjects } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListReviewsQueryKey } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, Code2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LANGUAGES = ["javascript", "typescript", "python", "go", "rust", "java", "cpp", "ruby", "php", "swift"];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  code: z.string().min(10, "Code must be at least 10 characters"),
  language: z.string().min(1, "Select a language"),
  projectId: z.string().optional(),
  context: z.string().optional(),
});

const ANALYSIS_STEPS = [
  "Parsing syntax tree...",
  "Checking for security vulnerabilities...",
  "Analyzing performance patterns...",
  "Applying project conventions...",
  "Cross-referencing memory patterns...",
  "Generating suggestions...",
  "Finalizing review...",
];

export default function NewReview() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: projects } = useListProjects();
  const createReview = useCreateReview();

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", code: "", language: "", projectId: "", context: "" },
  });

  useEffect(() => {
    if (!analyzing) return;
    const total = ANALYSIS_STEPS.length;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setAnalyzeStep(Math.min(step, total - 1));
      setAnalyzeProgress(Math.min(Math.floor((step / total) * 100), 95));
      if (step >= total) clearInterval(interval);
    }, 380);
    return () => clearInterval(interval);
  }, [analyzing]);

  async function onSubmit(values: z.infer<typeof schema>) {
    setAnalyzing(true);
    setAnalyzeStep(0);
    setAnalyzeProgress(0);

    // Let the animation run for a moment
    await new Promise((r) => setTimeout(r, 2600));

    createReview.mutate(
      {
        data: {
          title: values.title,
          code: values.code,
          language: values.language,
          projectId: values.projectId && values.projectId !== "none" ? parseInt(values.projectId) : undefined,
          context: values.context || undefined,
        },
      },
      {
        onSuccess: (review) => {
          setAnalyzeProgress(100);
          queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
          setTimeout(() => {
            setAnalyzing(false);
            setLocation(`/reviews/${review.id}`);
          }, 400);
        },
        onError: () => {
          setAnalyzing(false);
          toast({ title: "Review failed", description: "Could not analyze the code.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Code Review</h1>
        <p className="text-muted-foreground mt-1">Paste your code and the AI agent will analyze it</p>
      </div>

      <AnimatePresence>
        {analyzing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <Card className="w-full max-w-md mx-4">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                </div>
                <CardTitle>Analyzing Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={analyzeProgress} className="h-1.5" />
                <div className="space-y-1.5">
                  {ANALYSIS_STEPS.map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: i <= analyzeStep ? 1 : 0.25 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      {i < analyzeStep ? (
                        <span className="w-4 h-4 text-green-500 flex-shrink-0">&#10003;</span>
                      ) : i === analyzeStep ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                      ) : (
                        <span className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className={i < analyzeStep ? "text-muted-foreground line-through" : i === analyzeStep ? "text-foreground font-medium" : "text-muted-foreground"}>{step}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review Title</FormLabel>
                <FormControl>
                  <Input data-testid="input-review-title" placeholder="e.g. User authentication middleware" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project (optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-project">
                        <SelectValue placeholder="No project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects?.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Textarea
                    data-testid="textarea-code"
                    placeholder="Paste your code here..."
                    className="font-mono text-sm min-h-[280px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="context"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Context (optional)</FormLabel>
                <FormControl>
                  <Input data-testid="input-context" placeholder="e.g. This is an Express middleware for JWT validation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              data-testid="button-submit-review"
              disabled={createReview.isPending || analyzing}
              className="gap-2"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
              Analyze Code
            </Button>
            <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
