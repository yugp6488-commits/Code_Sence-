import { useGetDashboard, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Code, FolderGit2, Users, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { data: dashboard, isLoading: isDashboardLoading } = useGetDashboard();
  const { data: activity, isLoading: isActivityLoading } = useGetRecentActivity();

  if (isDashboardLoading || isActivityLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle>
            <Code className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.totalReviews ?? 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Acceptance Rate</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.acceptanceRate ? `${dashboard.acceptanceRate}%` : '0%'}</div>
            <Progress value={dashboard?.acceptanceRate ?? 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
            <FolderGit2 className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.totalProjects ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Teams</CardTitle>
            <Users className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.totalTeams ?? 0}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity?.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <Activity className="w-4 h-4 mt-1 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{item.reviewTitle}</p>
                    <p className="text-xs text-muted-foreground">{item.details}</p>
                  </div>
                </div>
              ))}
              {!activity?.length && <div className="text-sm text-muted-foreground text-center py-4">No recent activity</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}