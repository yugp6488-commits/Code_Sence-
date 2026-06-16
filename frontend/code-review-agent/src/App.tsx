import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import ReviewList from "@/pages/ReviewList";
import NewReview from "@/pages/NewReview";
import ReviewDetail from "@/pages/ReviewDetail";
import Projects from "@/pages/Projects";
import NewProject from "@/pages/NewProject";
import Teams from "@/pages/Teams";
import Memory from "@/pages/Memory";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/reviews/new" component={NewReview} />
        <Route path="/reviews/:id" component={ReviewDetail} />
        <Route path="/reviews" component={ReviewList} />
        <Route path="/projects/new" component={NewProject} />
        <Route path="/projects" component={Projects} />
        <Route path="/teams" component={Teams} />
        <Route path="/memory" component={Memory} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
