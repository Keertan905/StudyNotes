package com.studyapp.backend.util;

import com.studyapp.backend.exception.BadRequestException;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;

public final class FileUploadSecurityUtil {

    private FileUploadSecurityUtil() {}

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "txt", "md", "markdown", "doc", "docx", "jpg", "jpeg", "png", "webp"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "text/plain",
            "text/markdown",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/octet-stream",
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private static final long MAX_FILE_SIZE_BYTES = 20L * 1024 * 1024; // 20 MB
    private static final int MAX_TEXT_CHARACTERS = 500_000;

    /**
     * Validates and sanitizes an uploaded file to prevent path traversal,
     * executable uploads, and excessively large payloads.
     *
     * @param file the uploaded multipart file
     * @return clean and safe filename
     */
    public static String validateAndSanitizeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file is null or empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("File exceeds maximum allowed size of 20MB");
        }

        String rawFilename = file.getOriginalFilename();
        if (rawFilename == null || rawFilename.isBlank()) {
            throw new BadRequestException("Invalid file: filename cannot be empty");
        }

        // Check for directory traversal sequences
        if (rawFilename.contains("..") || rawFilename.contains("/") || rawFilename.contains("\\") || rawFilename.contains("\0")) {
            throw new BadRequestException("Invalid filename: Directory traversal or null byte detected");
        }

        // Clean filename to only base name
        String cleanName = Paths.get(rawFilename).getFileName().toString().trim();

        // Extract and validate file extension
        int dotIndex = cleanName.lastIndexOf('.');
        if (dotIndex <= 0 || dotIndex == cleanName.length() - 1) {
            throw new BadRequestException("File must have a valid extension (e.g. .pdf, .txt, .md)");
        }

        String extension = cleanName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Unsupported file type '." + extension +
                    "'. Only academic documents and text files are allowed: " + ALLOWED_EXTENSIONS);
        }

        // Check MIME type if present
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            String lowerMime = contentType.toLowerCase(Locale.ROOT).split(";")[0].trim();
            if (!ALLOWED_MIME_TYPES.contains(lowerMime) && !lowerMime.startsWith("text/")) {
                throw new BadRequestException("Invalid file content type: " + lowerMime);
            }
        }

        // Sanitize characters: preserve only alphanumeric, dot, underscore, and dash
        String baseWithoutExt = cleanName.substring(0, dotIndex).replaceAll("[^a-zA-Z0-9_-]", "_");
        if (baseWithoutExt.isBlank()) {
            baseWithoutExt = "uploaded_document";
        }

        return baseWithoutExt + "." + extension;
    }

    /**
     * Validates and sanitizes raw text content submitted for document notes or syllabus.
     */
    public static String sanitizeTextContent(String content) {
        if (content == null || content.isBlank()) {
            throw new BadRequestException("Text content cannot be empty");
        }

        if (content.length() > MAX_TEXT_CHARACTERS) {
            throw new BadRequestException("Text content exceeds maximum limit of " + MAX_TEXT_CHARACTERS + " characters");
        }

        // Strip null bytes and non-printable control characters (except newline, tab, carriage return)
        return content.replace("\0", "").trim();
    }

    public static boolean isPdfFile(String filename) {
        return filename != null && filename.toLowerCase(Locale.ROOT).endsWith(".pdf");
    }

    public static boolean isImageFile(String filename) {
        if (filename == null) return false;
        String lower = filename.toLowerCase(Locale.ROOT);
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp");
    }
}
