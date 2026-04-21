/**
 * RULE ENGINE - Evaluasi Zona K3
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
 *   Green Zone  = tidak ada requirement → fokus fasilitas K3
 *
 * Input dari ZoneCondition (Unity):
 * {
 *   zoneType              : "red" | "yellow" | "green",
 *   kondisiFaktual        : "tidak_tersedia" | "tidak_lengkap" | "partial" | "ok",
 *   kondisiRambu          : "tidak_tersedia" | "sulit_terlihat" | "ok",
 *   kondisiGarisPembatas  : "tidak_tersedia" | "sulit_terlihat" | "ok",
 *   identifikasiUser      : { [id: string]: boolean },  // checkbox yang dicentang user
 *   tindakan              : "segera_lengkapi" | "tambahkan_perbaiki" | "kondisi_sesuai"
 * }
 *
 * Output:
 * {
 *   klasifikasi : "CA" | "OR" | "UR" | "MD",
 *   keterangan  : string
 * }
 */

function evaluasiZona(payload) {
  const {
    zoneType,
    kondisiFaktual,
    kondisiRambu,
    kondisiGarisPembatas,
    identifikasiUser,
    tindakan,
  } = payload;

  console.log(
    `[RULE ENGINE] zone=${zoneType}, kondisi=${kondisiFaktual}, tindakan=${tindakan}`,
  );
  console.log(
    `[RULE ENGINE] rambu=${kondisiRambu}, garisPembatas=${kondisiGarisPembatas}`,
  );

  // Ada tidaknya identifikasi dari user (minimal satu checkbox dicentang)
  const adaIdentifikasi =
    identifikasiUser && Object.values(identifikasiUser).some((v) => v === true);

  // ==================== RED ZONE ====================
  // Wajib: rambu + garis pembatas, keduanya harus ada dan jelas
  if (zoneType === "red") {
    // KASUS 1: Tidak ada fasilitas sama sekali (rambu + garis pembatas keduanya tidak ada)
    if (kondisiFaktual === "tidak_tersedia") {
      if (!adaIdentifikasi) {
        return md("Gagal mendeteksi tidak adanya fasilitas di red zone.");
      }
      if (tindakan === "segera_lengkapi") {
        return ca(
          "Red zone tanpa fasilitas sama sekali harus segera dilengkapi.",
        );
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ur(
          "Terlalu lunak: red zone tanpa fasilitas harus segera dilengkapi, bukan sekadar ditambahkan.",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return md(
          "Tidak ada fasilitas sama sekali tapi dianggap kondisi sesuai.",
        );
      }
    }

    // KASUS 2: Salah satu tidak ada (rambu ada tapi garis pembatas tidak ada, atau sebaliknya)
    if (kondisiFaktual === "tidak_lengkap") {
      if (!adaIdentifikasi) {
        return md("Gagal mendeteksi fasilitas tidak lengkap di red zone.");
      }
      if (tindakan === "segera_lengkapi") {
        return ca(
          "Red zone dengan fasilitas tidak lengkap harus segera dilengkapi.",
        );
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ca(
          "Menambahkan fasilitas yang kurang adalah tindakan proporsional.",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return md(
          "Fasilitas tidak lengkap di red zone tidak bisa dianggap sesuai.",
        );
      }
    }

    // KASUS 3: Semua ada tapi ada yang bermasalah (sulit terlihat)
    if (kondisiFaktual === "partial") {
      if (!adaIdentifikasi) {
        return md("Gagal mendeteksi masalah fasilitas di red zone.");
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ca(
          "Ada sebagian fasilitas bermasalah; tambahkan/perbaiki adalah tindakan proporsional.",
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

    // KASUS 4: Semua lengkap dan jelas
    if (kondisiFaktual === "ok") {
      if (adaIdentifikasi) {
        return or(
          "Mengidentifikasi masalah yang sebenarnya tidak ada di red zone.",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return ca("Red zone sudah lengkap dan sesuai standar.");
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ur("Kondisi sudah ok, tidak perlu tambah/perbaiki.");
      }
      if (tindakan === "segera_lengkapi") {
        return ur("Kondisi sudah ok, tidak perlu segera dilengkapi.");
      }
    }
  }

  // ==================== YELLOW ZONE ====================
  // Wajib: rambu saja — garis pembatas BUKAN requirement
  if (zoneType === "yellow") {
    // KASUS 1: Rambu tidak ada
    if (kondisiFaktual === "tidak_tersedia") {
      if (!adaIdentifikasi) {
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

    // KASUS 2: Rambu ada tapi sulit terlihat
    if (kondisiFaktual === "partial") {
      if (!adaIdentifikasi) {
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

    // KASUS 3: Rambu lengkap dan jelas
    // Catatan: garis pembatas tidak wajib di yellow zone
    if (kondisiFaktual === "ok") {
      if (adaIdentifikasi) {
        return or(
          "Mengidentifikasi masalah yang sebenarnya tidak ada di yellow zone (garis pembatas bukan requirement yellow zone).",
        );
      }
      if (tindakan === "kondisi_sesuai") {
        return ca(
          "Rambu lengkap dan jelas; kondisi sesuai standar yellow zone.",
        );
      }
      if (tindakan === "tambahkan_perbaiki") {
        return ur("Kondisi sudah ok, tidak perlu tambah/perbaiki.");
      }
      if (tindakan === "segera_lengkapi") {
        return ur("Kondisi sudah ok, tidak perlu segera dilengkapi.");
      }
    }
  }

  // ==================== GREEN ZONE ====================
  // Tidak ada requirement rambu/garis pembatas → kondisiFaktual selalu "ok" dari ZoneCondition
  if (zoneType === "green") {
    if (adaIdentifikasi) {
      return or(
        "Mengidentifikasi masalah yang sebenarnya tidak ada di green zone.",
      );
    }
    if (tindakan === "kondisi_sesuai") {
      return ca("Green zone sudah sesuai standar.");
    }
    if (tindakan === "tambahkan_perbaiki") {
      return ur("Kondisi sudah ok, tidak perlu tambah/perbaiki.");
    }
    if (tindakan === "segera_lengkapi") {
      return ur("Kondisi sudah ok, tidak perlu segera dilengkapi.");
    }
  }

  // Fallback untuk kombinasi tidak dikenal
  return {
    klasifikasi: "UNKNOWN",
    keterangan: `Kombinasi tidak dikenali: zone=${zoneType}, kondisi=${kondisiFaktual}, tindakan=${tindakan}`,
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
