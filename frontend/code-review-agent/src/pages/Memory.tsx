import { useGetMemoryStats, useListMemoryPatterns } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, TrendingUp, Shield, Zap, Palette, Cpu, CheckSquare, Target } from "lucide-react";
import { motion } from "framer-motion";

function CategoryIcon({ category }: { category: string }) {
  const map: Record<string, React.ReactNode> = {
    security: <Shield className="w-3.5 h-3.5" />,
    performance: <Zap className="w-3.5 h-3.5" />,
    style: <Palette className="w-3.5 h-3.5" />,
    logic: <Cpu className="w-3.5 h-3.5" />,
    "best-practice": <CheckSquare className="w-3.5 h-3.5" />,
  };
  return map[category] ?? <CheckSquare className="w-3.5 h-3.5" />;
}

function CategoryColor(category: string) {
  const map: Record<string, string> = {
    security: "text-red-500 bg-red-500/10 border-red-500/20",
    performance: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    style: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    logic: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    "best-practice": "text-green-500 bg-green-500/10 border-green-500/20",
  };
  return map[category] ?? "text-muted-foreground bg-muted border-border";
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <Progress value={pct} className="h-1.5 flex-1" />
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function Memory() {
  const { data: stats, isLoading: statsLoading } = useGetMemoryStats();
  const { data: patterns, isLoading: patternsLoading } = useListMemoryPatterns();

  if (statsLoading || patternsLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-primary" />
          Memory & Learning
        </h1>
        <p className="text-muted-foreground mt-1">How the agent has learned from your team's feedback</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Reviews", value: stats?.totalReviews ?? 0, icon: <Target className="w-4 h-4" /> },
          { label: "Suggestions Made", value: stats?.totalSuggestions ?? 0, icon: <TrendingUp className="w-4 h-4" /> },
          { label: "Acceptance Rate", value: `${stats?.acceptanceRate ?? 0}%`, icon: <CheckSquare className="w-4 h-4" />, highlight: true },
          { label: "Patterns Learned", value: stats?.patternsLearned ?? 0, icon: <BrainCircuit className="w-4 h-4" /> },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card data-testid={`stat-card-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className={s.highlight ? "text-primary" : "text-muted-foreground"}>{s.icon}</span>
                </div>
                <div className={`text-2xl font-bold ${s.highlight ? "text-primary" : ""}`}>{s.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Learning progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="w-4 h-4 text-primary" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Agent intelligence level</span>
            <span className="font-semibold text-primary">{stats?.learningProgress ?? 0}%</span>
          </div>
          <Progress data-testid="progress-learning" value={stats?.learningProgress ?? 0} className="h-3" />
          <p className="text-xs text-muted-foreground pt-1">
            Based on {stats?.patternsLearned} learned patterns across {stats?.totalReviews} reviews.
            {(stats?.acceptanceRate ?? 0) >= 70 ? " Your team's preferences are well understood." : " Keep giving feedback to improve accuracy."}
          </p>
        </CardContent>
      </Card>

      {/* Top issues */}
      {stats?.topIssues && stats.topIssues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Issue Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topIssues.map((issue, i) => (
                <motion.div
                  key={issue.category}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded border font-medium capitalize w-32 shrink-0 ${CategoryColor(issue.category)}`}>
                    <CategoryIcon category={issue.category} />
                    {issue.category}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{issue.count} occurrence{issue.count !== 1 ? "s" : ""}</span>
                      <span>{issue.acceptanceRate}% accepted</span>
                    </div>
                    <Progress value={issue.acceptanceRate} className="h-1.5" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Language breakdown */}
      {stats?.languageBreakdown && stats.languageBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Language Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.languageBreakdown.map((l, i) => {
                const max = stats.languageBreakdown[0]?.count ?? 1;
                return (
                  <motion.div
                    key={l.language}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs font-mono w-24 text-muted-foreground shrink-0">{l.language}</span>
                    <div className="flex-1">
                      <Progress value={(l.count / max) * 100} className="h-1.5" />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{l.count}</span>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learned patterns */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Learned Patterns</h2>
        {!patterns?.length ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <BrainCircuit className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No patterns learned yet. Accept or reject suggestions to teach the agent.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {patterns.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card data-testid={`card-pattern-${p.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded border font-medium capitalize shrink-0 ${CategoryColor(p.category)}`}>
                        <CategoryIcon category={p.category} />
                        {p.category}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.pattern}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {p.language && (
                            <span className="text-xs text-muted-foreground font-mono">{p.language}</span>
                          )}
                          <span className="text-xs text-muted-foreground">{p.occurrences}× seen</span>
                        </div>
                        <div className="mt-2">
                          <ConfidenceBar value={p.confidence} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
