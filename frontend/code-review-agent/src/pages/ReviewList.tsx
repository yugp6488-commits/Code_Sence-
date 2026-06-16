import { useState } from "react";
import { Link } from "wouter";
import { useListReviews } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Search, Code2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const LANGUAGES = ["all", "javascript", "typescript", "python", "go", "rust"];

function severityColor(severity: string) {
  if (severity === "critical") return "destructive";
  if (severity === "warning") return "secondary";
  return "outline";
}

function LanguageBadge({ lang }: { lang: string }) {
  const colors: Record<string, string> = {
    javascript: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    typescript: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    python: "bg-green-500/10 text-green-500 border-green-500/20",
    go: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    rust: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-mono font-medium ${colors[lang] ?? "bg-muted text-muted-foreground border-border"}`}>
      {lang}
    </span>
  );
}

export default function ReviewList() {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const { data: reviews, isLoading } = useListReviews({ language: language !== "all" ? language : undefined });

  const filtered = reviews?.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Code Reviews</h1>
          <p className="text-muted-foreground mt-1">All review sessions with AI suggestions</p>
        </div>
        <Link href="/reviews/new">
          <Button data-testid="button-new-review" className="gap-2">
            <PlusCircle className="w-4 h-4" />
            New Review
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-search-reviews"
            className="pl-9"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger data-testid="select-language-filter" className="w-40">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l} value={l}>{l === "all" ? "All Languages" : l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : !filtered?.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <Code2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No reviews yet</p>
          <p className="text-sm mt-1">Submit your first code review to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/reviews/${review.id}`}>
                <Card data-testid={`card-review-${review.id}`} className="cursor-pointer hover:border-primary/50 transition-colors group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold group-hover:text-primary transition-colors truncate">{review.title}</span>
                          <LanguageBadge lang={review.language} />
                          {review.projectName && (
                            <span className="text-xs text-muted-foreground">in {review.projectName}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span data-testid={`text-suggestion-count-${review.id}`}>{review.suggestionCount} suggestion{review.suggestionCount !== 1 ? "s" : ""}</span>
                          {review.acceptedCount > 0 && (
                            <span className="flex items-center gap-1 text-green-500">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {review.acceptedCount} accepted
                            </span>
                          )}
                          {review.rejectedCount > 0 && (
                            <span className="flex items-center gap-1 text-destructive">
                              <XCircle className="w-3.5 h-3.5" />
                              {review.rejectedCount} rejected
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Badge variant={review.status === "completed" ? "secondary" : "outline"} className="shrink-0">
                        {review.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
