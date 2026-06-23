import jsPDF from "jspdf";
import { BookDetail } from "./types";
import { photoUrl } from "./api";

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportBookToPDF(book: BookDetail): Promise<void> {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(28);
  doc.setTextColor(124, 58, 237);
  doc.text(book.title, pageW / 2, 80, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(150, 120, 180);
  doc.text(`For ${book.person_name}`, pageW / 2, 95, { align: "center" });

  if (book.description) {
    doc.setFontSize(12);
    doc.setTextColor(120, 120, 120);
    const descLines = doc.splitTextToSize(book.description, 150);
    doc.text(descLines, pageW / 2, 115, { align: "center" });
  }

  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text("Made with Eternova", pageW / 2, 280, { align: "center" });

  for (const entry of book.entries) {
    doc.addPage();
    let y = 25;

    doc.setFontSize(20);
    doc.setTextColor(30, 10, 46);
    doc.text(entry.title, 20, y);
    y += 10;

    if (entry.entry_date) {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(entry.entry_date, 20, y);
      y += 8;
    }

    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(entry.content, 170);
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 25;
      }
      doc.text(line, 20, y);
      y += 6;
    }
    y += 8;

    for (const photo of entry.photos) {
      const imgData = await fetchImageAsBase64(photoUrl(photo.file_path));
      if (!imgData) continue;
      if (y > 200) {
        doc.addPage();
        y = 25;
      }
      try {
        doc.addImage(imgData, "JPEG", 20, y, 80, 60);
        y += 65;
      } catch {
        // skip unsupported image format
      }
    }
  }

  const safeName = book.title.replace(/[^a-z0-9]/gi, "_");
  doc.save(`${safeName}.pdf`);
}
