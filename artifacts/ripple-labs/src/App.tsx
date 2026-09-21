import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PurposeLab from "@/pages/purpose-lab";
import RippleMethodPage from "@/pages/ripple-method";
import RippleJourney from "@/pages/ripple-journey";
import AuthPage from "@/pages/auth";
import { ProtectedJourney } from "@/components/ProtectedJourney";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ripple-method" component={RippleMethodPage} />
      <Route path="/sign-in">{() => <AuthPage mode="sign-in" />}</Route>
      <Route path="/create-account">{() => <AuthPage mode="sign-up" />}</Route>
      <Route path="/ripple-journey">
        {() => (
          <ProtectedJourney>
            <RippleJourney />
          </ProtectedJourney>
        )}
      </Route>
      <Route path="/purpose-lab" component={PurposeLab} />
      <Route component={NotFound} />
    </Switch>
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
