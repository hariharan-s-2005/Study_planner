import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  not_started: "text-muted-foreground",
  in_progress: "text-warning",
  completed: "text-success",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
};

export default function SubjectDetail() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", difficulty: "medium", priority: "medium", deadline: "", estimated_hours: "1" });

  const fetchData = async () => {
    if (!user || !id) return;
    const { data: s } = await supabase.from("subjects").select("*").eq("id", id).single();
    setSubject(s);
    const { data: t } = await supabase.from("topics").select("*").eq("subject_id", id).order("created_at");
    setTopics(t || []);
  };

  useEffect(() => { fetchData(); }, [user, id]);

  const handleAdd = async () => {
    if (!user || !id || !form.name.trim()) return;
    const { error } = await supabase.from("topics").insert({
      user_id: user.id, subject_id: id, name: form.name,
      difficulty: form.difficulty as any, priority: form.priority as any,
      deadline: form.deadline || null, estimated_hours: Number(form.estimated_hours),
    });
    if (error) return toast.error(error.message);
    toast.success("Topic added!");
    setOpen(false); setForm({ name: "", difficulty: "medium", priority: "medium", deadline: "", estimated_hours: "1" });
    fetchData();
  };

  const toggleStatus = async (topic: any) => {
    const next = topic.status === "completed" ? "not_started" : topic.status === "not_started" ? "in_progress" : "completed";
    await supabase.from("topics").update({ status: next }).eq("id", topic.id);
    fetchData();
  };

  const handleDelete = async (topicId: string) => {
    await supabase.from("topics").delete().eq("id", topicId);
    toast.success("Topic deleted!");
    fetchData();
  };

  if (!subject) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link to="/subjects"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full" style={{ backgroundColor: subject.color }} />
          <h1 className="font-display text-3xl font-bold">{subject.name}</h1>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">{topics.length} topics</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Add Topic</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Add Topic</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Topic Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Calculus" />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Est. Hours</Label>
                  <Input type="number" min="0.5" step="0.5" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground">Add Topic</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {topics.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="glass group">
              <CardContent className="flex items-center gap-4 p-4">
                <button onClick={() => toggleStatus(t)} className={`transition-colors ${statusColors[t.status]}`}>
                  {t.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : t.status === "in_progress" ? <Clock className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{t.name}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{t.difficulty}</Badge>
                    <Badge className={`text-xs ${priorityColors[t.priority]}`}>{t.priority}</Badge>
                    {t.deadline && <Badge variant="outline" className="text-xs">{new Date(t.deadline).toLocaleDateString()}</Badge>}
                    <Badge variant="outline" className="text-xs">{t.estimated_hours}h</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
