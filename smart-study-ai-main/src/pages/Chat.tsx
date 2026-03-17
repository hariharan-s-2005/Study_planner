import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function Chat() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">AI Chat</h1>
        <p className="text-muted-foreground mt-1">Chat with your AI study assistant</p>
      </div>
      <Card className="glass">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-12 w-12 text-primary mb-4" />
          <p className="text-lg font-medium">Coming in Phase 5</p>
          <p className="text-sm text-muted-foreground">Conversational AI planning assistant</p>
        </CardContent>
      </Card>
    </div>
  );
}
