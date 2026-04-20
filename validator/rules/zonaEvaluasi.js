/**
 * RULE ENGINE - Evaluasi Zona K3
 *
 * Mengevaluasi TINDAKAN ASLI USER (bukan hasil auto-correct dari Unity)
 *
 * Klasifikasi:
 * - CA (Correct Action)  : Identifikasi benar + tindakan proporsional
 * - OR (Overreaction)    : Identifikasi benar, tindakan terlalu keras
 * - UR (Underreaction)   : Identifikasi benar tapi tindakan terlalu lunak,
 *                          atau gagal mengidentifikasi pelanggaran yang ada
 * - MD (Missed Detection): Mengidentifikasi masalah yang tidak ada,
 *                          atau salah mengklasifikasi jenis masalah
 *
 * Referensi: RKS SDN Duren Seribu 4 Pasal 14; Permen PUPR No.10/2021
 * Standar zona:
 *   Red Zone    = wajib rambu + garis pembatas
 *   Yellow Zone = wajib rambu saja
 *   Green Zone  = tidak ada pekerjaan aktif, fokus fasilitas K3
 *
 * Input:
 * {
 *   zoneType       : "red" | "yellow" | "green",
 *   kondisiFaktual : "none" | "partial" | "ok",
 *   identifikasi   : "tidak_tersedia" | "sulit_terlihat" | "tidak_lengkap"
 *                    | "ada_masalah" | "kosong",
 *   tindakan       : "segera_lengkapi" | "tambahkan_perbaiki" | "kondisi_sesuai"
 * }
 *
 * Output:
 * {
 *   klasifikasi : "CA" | "OR" | "UR" | "MD",
 *   keterangan  : string
 * }
 *
 * Changelog v2 (bugfix):
 *   [Bug 1] Red zone partial — label CA/OR terbalik untuk tambahkan_perbaiki vs segera_lengkapi
 *   [Bug 2] Yellow zone none + segera_lengkapi — harusnya OR bukan UR
 *   [Bug 3] Semua zona kondisi ok + adaMasalah — harusnya OR bukan MD
 */

function evaluasiZona(payload) {
  const { zoneType, kondisiFaktual, identifikasi, tindakan } = payload;

  console.log(
    `[RULE ENGINE] Evaluating: zone=${zoneType}, kondisi=${kondisiFaktual}, identifikasi=${identifikasi}, tindakan=${tindakan}`,
  );

  const identifikasiKosong =
    identifikasi === "kosong" || identifikasi === undefined;
  const adaMasalah = identifikasi !== "kosong" && identifikasi !== undefined;

  // ==================== RED ZONE ====================
  if (zoneType === "red") {
    // KASUS 1: Tidak ada fasilitas sama sekali
    if (kondisiFaktual === "none") {
      if (identifikasiKosong) {
        return md("Gagal mendeteksi tidak adanya fasilitas di red zone.");
      }
      if (tindakan === "segera_lengkapi") {
        return ca("Red zone tanpa fasilitas, harus segera dilengkapi.");
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ur(
          "Terlalu lunak: red zone tanpa fasilitas harus segera dilengkapi, bukan sekadar ditambahkan.",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return md("Tidak ada fasilitas tapi dianggap kondisi sesuai.");
      }
    }

    // KASUS 2: Fasilitas ada tapi bermasalah (partial)
    // [Bug 1 Fix] tambahkan_perbaiki = CA (proporsional), segera_lengkapi = OR (terlalu keras)
    if (kondisiFaktual === "partial") {
      if (identifikasiKosong) {
        return md("Gagal mendeteksi masalah fasilitas di red zone.");
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ca(
          "Ada sebagian fasilitas yang bermasalah; tambahkan/perbaiki adalah tindakan proporsional.",
        );
      }
      if (tindakan === "segera_lengkapi") {
        return or(
          "Terlalu keras: masih ada fasilitas sebagian, cukup diperbaiki/ditambahkan.",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return md("Kondisi partial di red zone tidak bisa dianggap sesuai.");
      }
    }

    // KASUS 3: Fasilitas lengkap dan baik (ok)
    // [Bug 3 Fix] adaMasalah saat kondisi ok = OR (over-identifikasi), bukan MD
    if (kondisiFaktual === "ok") {
      if (adaMasalah) {
        return or(
          "Mengidentifikasi masalah yang sebenarnya tidak ada di red zone.",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return ca("Red zone sudah lengkap dan sesuai standar.");
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ur(
          "Terlalu berlebihan: kondisi sudah ok, tidak perlu tambah/perbaiki.",
        );
      }
      if (tindakan === "segera_lengkapi") {
        return ur(
          "Terlalu berlebihan: kondisi sudah ok, tidak perlu segera dilengkapi.",
        );
      }
    }
  }

  // ==================== YELLOW ZONE ====================
  if (zoneType === "yellow") {
    // KASUS 1: Tidak ada rambu sama sekali
    // [Bug 2 Fix] segera_lengkapi = OR (terlalu keras untuk yellow zone), bukan UR
    if (kondisiFaktual === "none") {
      if (identifikasiKosong) {
        return md("Gagal mendeteksi tidak adanya rambu di yellow zone.");
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ca(
          "Yellow zone wajib rambu; tidak ada rambu berarti perlu ditambahkan.",
        );
      }
      if (tindakan === "segera_lengkapi") {
        return or(
          "Terlalu keras: yellow zone cukup ditambahkan rambu, tidak perlu segera dilengkapi.",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return md("Tidak ada rambu tapi dianggap kondisi sesuai.");
      }
    }

    // KASUS 2: Rambu ada tapi bermasalah (partial)
    if (kondisiFaktual === "partial") {
      if (identifikasiKosong) {
        return md("Gagal mendeteksi masalah rambu di yellow zone.");
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ca("Rambu bermasalah perlu diperbaiki atau ditambahkan.");
      }
      if (tindakan === "segera_lengkapi") {
        return or(
          "Terlalu keras: kondisi partial cukup diperbaiki, tidak perlu segera dilengkapi.",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return md("Kondisi partial tidak bisa dianggap sesuai.");
      }
    }

    // KASUS 3: Rambu lengkap dan baik (ok)
    // [Bug 3 Fix] adaMasalah saat kondisi ok = OR (over-identifikasi), bukan MD
    // Catatan: garis pembatas tidak wajib di yellow zone, jadi ok meski tanpa garis pembatas
    if (kondisiFaktual === "ok") {
      if (adaMasalah) {
        return or(
          "Mengidentifikasi masalah yang sebenarnya tidak ada di yellow zone (misal: garis pembatas bukan requirement yellow zone).",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return ca(
          "Rambu lengkap dan jelas; kondisi sesuai standar yellow zone.",
        );
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ur(
          "Terlalu berlebihan: kondisi sudah ok, tidak perlu tambah/perbaiki.",
        );
      }
      if (tindakan === "segera_lengkapi") {
        return ur(
          "Terlalu berlebihan: kondisi sudah ok, tidak perlu segera dilengkapi.",
        );
      }
    }
  }

  // ==================== GREEN ZONE ====================
  if (zoneType === "green") {
    // KASUS 1: Tidak ada fasilitas sama sekali
    if (kondisiFaktual === "none") {
      if (identifikasiKosong) {
        return md("Gagal mendeteksi tidak adanya fasilitas di green zone.");
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ca(
          "Green zone perlu fasilitas yang memadai; perlu ditambahkan.",
        );
      }
      if (tindakan === "segera_lengkapi") {
        return or(
          "Terlalu keras: green zone cukup ditambahkan, tidak perlu segera dilengkapi.",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return md("Tidak ada fasilitas tapi dianggap kondisi sesuai.");
      }
    }

    // KASUS 2: Fasilitas tidak lengkap (partial)
    if (kondisiFaktual === "partial") {
      if (identifikasiKosong) {
        return md("Gagal mendeteksi fasilitas tidak lengkap di green zone.");
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ca("Fasilitas tidak lengkap perlu dilengkapi atau diperbaiki.");
      }
      if (tindakan === "segera_lengkapi") {
        return or(
          "Terlalu keras: kondisi partial cukup ditambahkan atau diperbaiki.",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return md("Kondisi partial tidak bisa dianggap sesuai.");
      }
    }

    // KASUS 3: Fasilitas lengkap dan baik (ok)
    // [Bug 3 Fix] adaMasalah saat kondisi ok = OR (over-identifikasi), bukan MD
    if (kondisiFaktual === "ok") {
      if (adaMasalah) {
        return or(
          "Mengidentifikasi masalah yang sebenarnya tidak ada di green zone.",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return ca("Green zone sudah sesuai standar.");
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ur(
          "Terlalu berlebihan: kondisi sudah ok, tidak perlu tambah/perbaiki.",
        );
      }
      if (tindakan === "segera_lengkapi") {
        return ur(
          "Terlalu berlebihan: kondisi sudah ok, tidak perlu segera dilengkapi.",
        );
      }
    }
  }

  // Fallback untuk kombinasi tidak dikenal
  return {
    klasifikasi: "UNKNOWN",
    keterangan: `Kombinasi tidak dikenali: zone=${zoneType}, kondisi=${kondisiFaktual}, identifikasi=${identifikasi}, tindakan=${tindakan}`,
  };
}

// Helper functions
function ca(keterangan) {
  return { klasifikasi: "CA", keterangan };
}
function or(keterangan) {
  return { klasifikasi: "OR", keterangan };
}
function ur(keterangan) {
  return { klasifikasi: "UR", keterangan };
}
function md(keterangan) {
  return { klasifikasi: "MD", keterangan };
}

// Export untuk Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { evaluasiZona };
}
