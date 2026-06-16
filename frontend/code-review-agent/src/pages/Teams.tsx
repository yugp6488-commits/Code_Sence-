import { useState } from "react";
import { useListTeams, useCreateTeam, useDeleteTeam, getListTeamsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Users, Trash2, FolderGit2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function Teams() {
  const { data: teams, isLoading } = useListTeams();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleCreate() {
    if (!name.trim()) return;
    createTeam.mutate(
      { data: { name: name.trim(), description: description.trim() || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
          toast({ title: "Team created" });
          setOpen(false);
          setName("");
          setDescription("");
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create team.", variant: "destructive" });
        },
      }
    );
  }

  function handleDelete(id: number, teamName: string) {
    if (!confirm(`Delete team "${teamName}"?`)) return;
    deleteTeam.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
          toast({ title: "Team deleted" });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete team.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-1">Organize projects under team workspaces</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-team" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  data-testid="input-team-name"
                  placeholder="e.g. Platform Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-description">Description (optional)</Label>
                <Textarea
                  id="team-description"
                  data-testid="textarea-team-description"
                  placeholder="What does this team work on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  data-testid="button-create-team"
                  onClick={handleCreate}
                  disabled={createTeam.isPending || !name.trim()}
                >
                  Create Team
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)}
        </div>
      ) : !teams?.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No teams yet</p>
          <p className="text-sm mt-1">Create a team to share context across projects</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card data-testid={`card-team-${team.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <CardTitle className="text-base">{team.name}</CardTitle>
                    </div>
                    <Button
                      data-testid={`button-delete-team-${team.id}`}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(team.id, team.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {team.description && (
                    <p className="text-sm text-muted-foreground pl-10">{team.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FolderGit2 className="w-3.5 h-3.5" />
                      <span data-testid={`text-project-count-${team.id}`}>{team.projectCount} project{team.projectCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span data-testid={`text-team-review-count-${team.id}`}>{team.reviewCount} review{team.reviewCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Created {new Date(team.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
