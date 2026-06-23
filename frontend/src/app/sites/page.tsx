"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiListSites, apiDeleteSite, apiTogglePublish } from "@/lib/api";
import { MiniSite } from "@/lib/types";
import { QRCodeCanvas } from "qrcode.react";
import DetailsMenu from "@/components/DetailsMenu";
import { SITE_THEMES } from "@/lib/siteThemes";

export default function SitesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sites, setSites] = useState<MiniSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrSite, setQrSite] = useState<MiniSite | null>(null);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => {
    if (user) apiListSites().then(setSites).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this mini-site?")) return;
    await apiDeleteSite(id);
    setSites((prev) => prev.filter((s) => s.id !== id));
  };

  const handlePublish = async (id: string) => {
    const updated = await apiTogglePublish(id);
    setSites((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const downloadQR = () => {
    if (!qrSite) return;
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `eternova-qr-${qrSite.slug}.png`;
    a.click();
  };

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🌐 Mini Sites</h1>
        <Link href="/sites/new" className="px-5 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90">+ New Site</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : sites.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🌐</p>
          <h2 className="text-xl font-semibold mb-2">No mini-sites yet</h2>
          <p className="text-muted mb-6">Create a personalized website to share your love story</p>
          <Link href="/sites/new" className="px-5 py-2.5 rounded-xl gradient-brand text-white font-medium">Create Your First Site</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sites.map((site, i) => (
            <motion.div key={site.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-card-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-20 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${site.theme_color}, ${site.accent_color})` }}>
                <span className="text-white text-lg font-bold">{site.title}</span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted">/{site.slug}</p>
                    {site.partner_name && <p className="text-sm mt-1">With {site.partner_name}</p>}
                  </div>
                  <DetailsMenu
                    details={[
                      { label: "Created", value: new Date(site.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
                      { label: "Last Updated", value: new Date(site.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
                      { label: "Theme", value: SITE_THEMES[site.theme]?.name || site.theme },
                      { label: "Status", value: site.is_published ? "Published" : "Draft" },
                      { label: "Guestbook", value: site.guest_pin ? "Enabled" : "Disabled" },
                    ]}
                    onEdit={() => router.push(`/sites/${site.id}/edit`)}
                    onDelete={() => handleDelete(site.id)}
                  />
                </div>
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <button onClick={() => handlePublish(site.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium ${site.is_published
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-muted/20 text-muted"
                    }`}>
                    {site.is_published ? "Published" : "Draft"}
                  </button>
                  {site.is_published && (
                    <>
                      <Link href={`/site/${site.slug}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary">View</Link>
                      <button onClick={() => setQrSite(site)} className="text-xs px-3 py-1.5 rounded-lg bg-gold/10 text-gold">QR</button>
                    </>
                  )}
                  <Link href={`/sites/${site.id}/edit`} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary">Edit</Link>
                  <button onClick={() => handleDelete(site.id)} className="text-xs px-3 py-1.5 rounded-lg bg-danger/10 text-danger ml-auto">Delete</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {qrSite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setQrSite(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-card border border-card-border rounded-2xl p-8 text-center max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">QR Code for {qrSite.title}</h3>
              <div className="flex justify-center mb-4">
                <QRCodeCanvas
                  id="qr-canvas"
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/site/${qrSite.slug}`}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <p className="text-sm text-muted mb-4">/site/{qrSite.slug}</p>
              <div className="flex gap-3">
                <button onClick={downloadQR}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-white font-medium text-sm">
                  Download PNG
                </button>
                <button onClick={() => setQrSite(null)}
                  className="flex-1 py-2.5 rounded-xl border border-card-border font-medium text-sm">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
