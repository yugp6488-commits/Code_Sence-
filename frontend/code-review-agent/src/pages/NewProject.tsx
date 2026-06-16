import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProject, useListTeams, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FolderGit2 } from "lucide-react";

const LANGUAGES = ["javascript", "typescript", "python", "go", "rust", "java", "cpp", "ruby", "php", "swift", "css"];

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  teamId: z.string().optional(),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  conventions: z.string().min(1, "Enter at least one coding convention"),
});

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: teams } = useListTeams();
  const createProject = useCreateProject();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      teamId: "",
      languages: [],
      conventions: "",
    },
  });

  const selectedLanguages = form.watch("languages");

  function toggleLanguage(lang: string) {
    const current = form.getValues("languages");
    if (current.includes(lang)) {
      form.setValue("languages", current.filter((l) => l !== lang));
    } else {
      form.setValue("languages", [...current, lang]);
    }
    form.trigger("languages");
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    createProject.mutate(
      {
        data: {
          name: values.name,
          description: values.description || undefined,
          teamId: values.teamId && values.teamId !== "none" ? parseInt(values.teamId) : undefined,
          languages: values.languages,
          conventions: values.conventions,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast({ title: "Project created" });
          setLocation("/projects");
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create project.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FolderGit2 className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">New Project</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Define conventions the agent will learn from</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input data-testid="input-project-name" placeholder="e.g. API Gateway" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Team (optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-team">
                        <SelectValue placeholder="No team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No team</SelectItem>
                      {teams?.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Input data-testid="input-project-description" placeholder="Brief description of the project" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="languages"
            render={() => (
              <FormItem>
                <FormLabel>Languages</FormLabel>
                <FormDescription>Select all languages used in this project</FormDescription>
                <div className="flex flex-wrap gap-2 pt-1">
                  {LANGUAGES.map((lang) => (
                    <label
                      key={lang}
                      data-testid={`checkbox-lang-${lang}`}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-colors ${
                        selectedLanguages.includes(lang)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      <Checkbox
                        checked={selectedLanguages.includes(lang)}
                        onCheckedChange={() => toggleLanguage(lang)}
                        className="sr-only"
                      />
                      {lang}
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="conventions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coding Conventions</FormLabel>
                <FormDescription>These are fed into the AI agent as context for every review in this project</FormDescription>
                <FormControl>
                  <Textarea
                    data-testid="textarea-conventions"
                    placeholder="e.g. Use functional patterns. All async functions must handle errors. No any types. Max function length 30 lines."
                    className="min-h-[120px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" data-testid="button-create-project" disabled={createProject.isPending} className="gap-2">
              <FolderGit2 className="w-4 h-4" />
              Create Project
            </Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/projects")}>Cancel</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
