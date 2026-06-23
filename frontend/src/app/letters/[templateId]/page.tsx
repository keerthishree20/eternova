"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiGetTemplate, apiSaveDraft } from "@/lib/api";
import { LetterTemplateDetail } from "@/lib/types";

export default function LetterEditorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const templateId = params.templateId as string;
  const [template, setTemplate] = useState<LetterTemplateDetail | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);
  useEffect(() => {
    if (user && templateId) {
      apiGetTemplate(templateId).then((t) => {
        setTemplate(t);
        const init: Record<string, string> = {};
        t.fields.forEach((f) => (init[f.key] = ""));
        setFields(init);
      }).catch(() => router.push("/letters"));
    }
  }, [user, templateId, router]);

  const rendered = template
    ? template.body.replace(/\{(\w+)\}/g, (_, key) => fields[key] || `[${key}]`)
    : "";

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiSaveDraft(templateId, fields);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {} finally { setSaving(false); }
  };

  const handleDownload = () => {
    const blob = new Blob([rendered], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template?.name || "letter"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!template) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          <p className="text-muted">{template.description}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 text-sm">
            {saved ? "Saved!" : saving ? "Saving..." : "Save Draft"}
          </button>
          <button onClick={handleDownload}
            className="px-4 py-2 rounded-xl gradient-brand text-white font-medium hover:opacity-90 text-sm">
            Download
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-card-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Fill in the blanks</h2>
          {template.fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <input type="text" value={fields[f.key] || ""} placeholder={f.placeholder}
                onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-8">
          <h2 className="font-semibold text-lg mb-4 text-amber-800 dark:text-amber-200">Preview</h2>
          <div className="whitespace-pre-wrap leading-relaxed font-serif text-amber-900 dark:text-amber-100">
            {rendered}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
