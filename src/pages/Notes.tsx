import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [form, setForm] = useState({ title: "", content: "", subject_id: "none" });

  const fetchData = async () => {
    if (!user) return;
    const { data: n } = await supabase.from("notes").select("*, subjects(name, color)").eq("user_id", user.id).order("updated_at", { ascending: false });
    setNotes(n || []);
    const { data: s } = await supabase.from("subjects").select("*").eq("user_id", user.id).order("name");
    setSubjects(s || []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.title.trim()) return;
    const notesData = {
      user_id: user.id,
      title: form.title,
      content: form.content,
      subject_id: form.subject_id === "none" ? null : form.subject_id,
    };

    if (editId) {
      const { error } = await supabase.from("notes").update(notesData).eq("id", editId);
      if (error) return toast.error(error.message);
      toast.success("Note updated!");
    } else {
      const { error } = await supabase.from("notes").insert(notesData);
      if (error) return toast.error(error.message);
      toast.success("Note added!");
    }
    setOpen(false); setForm({ title: "", content: "", subject_id: "none" }); setEditId(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Note deleted!");
    fetchData();
  };

  const openEdit = (n: any) => {
    setEditId(n.id);
    setForm({ title: n.title, content: n.content || "", subject_id: n.subject_id || "none" });
    setOpen(true);
  };

  const filteredNotes = filterSubject === "all" ? notes : notes.filter((n) => n.subject_id === filterSubject);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground mt-1">Organize your study notes and resources</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({ title: "", content: "", subject_id: "none" }); } }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Add Note</Button>
            </DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader>
                <DialogTitle className="font-display">{editId ? "Edit" : "Add"} Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 1 Summary" />
                </div>
                <div className="space-y-2">
                  <Label>Subject (Optional)</Label>
                  <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General / No Subject</SelectItem>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your notes here..." className="h-40" />
                </div>
                <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground">
                  {editId ? "Update" : "Add"} Note
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No notes yet</p>
            <p className="text-sm text-muted-foreground">Click Add Note to create one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass group hover:shadow-md transition-shadow h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      {n.subjects && (
                        <Badge variant="outline" className="text-xs mb-2" style={{ borderColor: n.subjects.color, color: n.subjects.color }}>
                          {n.subjects.name}
                        </Badge>
                      )}
                      <CardTitle className="font-display text-lg font-bold">{n.title}</CardTitle>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(n)}><Edit2 className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(n.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{n.content}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
