export function errorMiddleware(error, _request, response, _next) {
  if (error.code === "TEACHER_NIP_DUPLICATE") {
    response.status(409).json({
      success: false,
      message: "NIP guru sudah terdaftar. Periksa kembali NIP yang digunakan.",
      error: { code: error.code, details: {} },
    });
    return;
  }

  if (error.code === "TEACHER_DUPLICATE") {
    response.status(409).json({
      success: false,
      message: "Email guru sudah terdaftar. Periksa kembali data guru.",
      error: { code: error.code, details: {} },
    });
    return;
  }

  if (error.code === "ER_DUP_ENTRY") {
    response.status(409).json({
      success: false,
      message:
        "Sekolah atau akun admin dengan data tersebut sudah ada. Periksa nama sekolah lalu coba lagi.",
      error: { code: "DATA_ALREADY_EXISTS", details: {} },
    });
    return;
  }

  if (
    error.code === "ER_BAD_NULL_ERROR" ||
    error.code === "ER_NO_DEFAULT_FOR_FIELD"
  ) {
    response.status(400).json({
      success: false,
      message: "Data sekolah belum lengkap. Periksa kembali isian formulir.",
      error: { code: "INCOMPLETE_DATA", details: {} },
    });
    return;
  }

  const statusCode = error.statusCode ?? 500;
  response.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Sekolah belum dapat dibuat sekarang. Silakan coba lagi beberapa saat lagi."
        : (error.message ?? "Permintaan belum dapat diproses."),
    error: {
      code:
        statusCode >= 500 ? "REQUEST_FAILED" : (error.code ?? "REQUEST_FAILED"),
      details: error.details ?? {},
    },
  });
}
