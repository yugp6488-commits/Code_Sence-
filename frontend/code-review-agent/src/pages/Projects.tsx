import { useState } from "react";
import { Link } from "wouter";
import { useListProjects, useDeleteProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, FolderGit2, Trash2, BookOpen, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

function LanguageChip({ lang }: { lang: string }) {
  const colors: Record<string, string> = {
    javascript: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    typescript: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    python: "bg-green-500/10 text-green-500 border-green-500/20",
    go: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    rust: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    css: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${colors[lang] ?? "bg-muted text-muted-foreground border-border"}`}>
      {lang}
    </span>
  );
}

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();
  const deleteProject = useDeleteProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function handleDelete(id: number, name: string) {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    deleteProject.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast({ title: "Project deleted" });
          setDeletingId(null);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
          setDeletingId(null);
        },
      }
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage coding conventions and shared context</p>
        </div>
        <Link href="/projects/new">
          <Button data-testid="button-new-project" className="gap-2">
            <PlusCircle className="w-4 h-4" />
            New Project
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      ) : !projects?.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderGit2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm mt-1">Create a project to group reviews and share conventions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card data-testid={`card-project-${project.id}`} className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{project.name}</CardTitle>
                      {project.teamName && (
                        <p className="text-xs text-muted-foreground mt-0.5">{project.teamName}</p>
                      )}
                    </div>
                    <Button
                      data-testid={`button-delete-project-${project.id}`}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      disabled={deletingId === project.id}
                      onClick={() => handleDelete(project.id, project.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {project.languages.map((l) => <LanguageChip key={l} lang={l} />)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span data-testid={`text-review-count-${project.id}`}>{project.reviewCount} review{project.reviewCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span data-testid={`text-acceptance-rate-${project.id}`}>{project.acceptanceRate}% acceptance</span>
                    </div>
                  </div>

                  {project.conventions && (
                    <div className="rounded-md bg-muted p-2.5">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Conventions</p>
                      <p className="text-xs text-foreground line-clamp-3 leading-relaxed">{project.conventions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
