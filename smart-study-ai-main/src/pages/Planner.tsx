import { Card, CardContent } from "@/components/ui/card";
import { Brain } from "lucide-react";

export default function Planner() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">AI Planner</h1>
        <p className="text-muted-foreground mt-1">Generate smart study plans powered by AI</p>
      </div>
      <Card className="glass">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Brain className="h-12 w-12 text-primary mb-4" />
          <p className="text-lg font-medium">Coming in Phase 3</p>
          <p className="text-sm text-muted-foreground">AI-powered schedule generation</p>
        </CardContent>
      </Card>
    </div>
  );
}
