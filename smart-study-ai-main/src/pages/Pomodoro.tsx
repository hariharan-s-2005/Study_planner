import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "lucide-react";

export default function Pomodoro() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Pomodoro Timer</h1>
        <p className="text-muted-foreground mt-1">Focus with timed study sessions</p>
      </div>
      <Card className="glass">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Timer className="h-12 w-12 text-primary mb-4" />
          <p className="text-lg font-medium">Coming in Phase 6</p>
          <p className="text-sm text-muted-foreground">25/5 min focus-break cycles</p>
        </CardContent>
      </Card>
    </div>
  );
}
