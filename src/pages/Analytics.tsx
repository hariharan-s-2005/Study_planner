import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your study progress</p>
      </div>
      <Card className="glass">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="h-12 w-12 text-primary mb-4" />
          <p className="text-lg font-medium">Coming in Phase 4</p>
          <p className="text-sm text-muted-foreground">Charts, trends, and performance insights</p>
        </CardContent>
      </Card>
    </div>
  );
}
