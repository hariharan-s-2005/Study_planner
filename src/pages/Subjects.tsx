import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, BookOpen, AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"];

export default function Subjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topicCounts, setTopicCounts] = useState<Record<string, { total: number; completed: number }>>({});
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const fetchSubjects = async () => {
    if (!user) return;
    const { data } = await supabase.from("subjects").select("*").eq("user_id", user.id).order("created_at");
    setSubjects(data || []);
    const { data: topics } = await supabase.from("topics").select("subject_id, status").eq("user_id", user.id);
    const counts: Record<string, { total: number; completed: number }> = {};
    (topics || []).forEach((t) => {
      if (!counts[t.subject_id]) counts[t.subject_id] = { total: 0, completed: 0 };
      counts[t.subject_id].total++;
      if (t.status === "completed") counts[t.subject_id].completed++;
    });
    setTopicCounts(counts);
  };

  useEffect(() => { fetchSubjects(); }, [user]);

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    if (editId) {
      const { error } = await supabase.from("subjects").update({ name, color }).eq("id", editId);
      if (error) return toast.error(error.message);
      toast.success("Subject updated!");
    } else {
      const { error } = await supabase.from("subjects").insert({ user_id: user.id, name, color });
      if (error) return toast.error(error.message);
      toast.success("Subject added!");
    }
    setOpen(false); setName(""); setEditId(null);
    fetchSubjects();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Subject deleted!");
    fetchSubjects();
  };

  const handleClearAll = async () => {
    if (!user) return;
    const { error } = await supabase.from("subjects").delete().eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("All subjects cleared!");
    fetchSubjects();
  };

  const openEdit = (s: any) => {
    setEditId(s.id); setName(s.name); setColor(s.color); setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage your subjects and topics</p>
        </div>
        <div className="flex items-center gap-2">
          {subjects.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Clear All</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all subjects?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your subjects and topics. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground">Delete All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setName(""); } }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">{editId ? "Edit" : "Add"} Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground">
                  {editId ? "Update" : "Add"} Subject
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {subjects.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No subjects yet</p>
            <p className="text-sm text-muted-foreground">Add your first subject to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s, i) => {
            const tc = topicCounts[s.id] || { total: 0, completed: 0 };
            const pct = tc.total > 0 ? Math.round((tc.completed / tc.total) * 100) : 0;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="glass group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: s.color }} />
                        <CardTitle className="font-display text-lg">
                          <Link to={`/subjects/${s.id}`} className="hover:text-primary transition-colors">{s.name}</Link>
                        </CardTitle>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Edit2 className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{tc.total} topics</span>
                      <Badge variant="secondary">{pct}% done</Badge>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
