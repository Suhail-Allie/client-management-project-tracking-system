const express = require("express");
const crypto = require("crypto");
const path = require("path");
const pool = require("../config/database");
const supabase = require("../config/supabase");

const router = express.Router();

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VISIBILITIES = new Set(["internal", "client"]);

const DOCUMENTS_BUCKET =
    process.env.SUPABASE_DOCUMENTS_BUCKET || "project-documents";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = new Set([
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "zip",
    "png",
    "jpg",
    "jpeg"
]);

const ALLOWED_MIME_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-zip-compressed",
    "image/png",
    "image/jpeg",
    "application/octet-stream"
]);

const MIME_BY_EXTENSION = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    zip: "application/zip",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg"
};

const DOCUMENT_SELECT = `
    SELECT
        d.id,
        d.project_id,
        d.file_name,
        d.storage_path,
        d.mime_type,
        d.size_bytes,
        d.description,
        d.visibility,
        d.uploaded_by,
        d.created_at,
        d.updated_at,
        p.project_code,
        p.name AS project_name,
        c.company_name,
        uploader.display_name AS uploaded_by_name
    FROM public.documents d
    INNER JOIN public.projects p
        ON p.id = d.project_id
    INNER JOIN public.clients c
        ON c.id = p.client_id
    LEFT JOIN public.profiles uploader
        ON uploader.id = d.uploaded_by
`;

function isUuid(value) {
    return typeof value === "string" && UUID_PATTERN.test(value);
}

function getDocumentScope(profile, placeholder = "$1") {
    switch (profile.role) {
        case "administrator":
            return {
                clause: "1=1",
                params: []
            };

        case "developer":
            return {
                clause: `p.assigned_developer_id = ${placeholder}`,
                params: [profile.id]
            };

        case "finance_manager":
            return {
                clause: "1=1",
                params: []
            };

        case "client":
            return {
                clause: `c.profile_id = ${placeholder} AND d.visibility = 'client'`,
                params: [profile.id]
            };

        default:
            return {
                clause: "1=0",
                params: []
            };
    }
}

function requireDocumentManager(req, res, next) {
    if (
        req.profile.role !== "administrator" &&
        req.profile.role !== "developer"
    ) {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to manage documents."
        });
    }

    next();
}


function getFileExtension(fileName) {
    return path.extname(fileName).replace(".", "").toLowerCase();
}

function sanitiseFileName(fileName) {
    return fileName
        .normalize("NFKC")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^\.+/, "")
        .slice(0, 180);
}

function validateUpload(fileName, mimeType, sizeBytes) {
    const extension = getFileExtension(fileName);

    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
        return "Unsupported file type.";
    }

    if (sizeBytes <= 0) {
        return "The uploaded file is empty.";
    }

    if (sizeBytes > MAX_FILE_SIZE) {
        return "File size must not exceed 10 MB.";
    }

    const normalisedMime = (mimeType || "").split(";")[0].trim().toLowerCase();

    if (
        normalisedMime &&
        !ALLOWED_MIME_TYPES.has(normalisedMime)
    ) {
        return "Unsupported MIME type.";
    }

    return null;
}

async function createDownloadUrl(storagePath) {
    const { data, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(storagePath, 60 * 60);

    if (error) {
        throw error;
    }

    return data.signedUrl;
}

function validateDocumentPayload(body, partial = false) {
    const errors = [];

    if (!partial || body.file_name !== undefined) {
        if (
            typeof body.file_name !== "string" ||
            body.file_name.trim().length === 0
        ) {
            errors.push("file_name is required.");
        } else if (body.file_name.trim().length > 255) {
            errors.push("file_name must not exceed 255 characters.");
        }
    }

    if (!partial || body.storage_path !== undefined) {
        if (
            typeof body.storage_path !== "string" ||
            body.storage_path.trim().length === 0
        ) {
            errors.push("storage_path is required.");
        } else if (body.storage_path.trim().length > 1000) {
            errors.push("storage_path must not exceed 1000 characters.");
        }
    }

    if (body.mime_type !== undefined && body.mime_type !== null) {
        if (
            typeof body.mime_type !== "string" ||
            body.mime_type.trim().length > 255
        ) {
            errors.push("mime_type is invalid.");
        }
    }

    if (body.size_bytes !== undefined && body.size_bytes !== null) {
        if (
            !Number.isInteger(body.size_bytes) ||
            body.size_bytes < 0
        ) {
            errors.push("size_bytes must be a non-negative integer.");
        }
    }

    if (body.description !== undefined && body.description !== null) {
        if (
            typeof body.description !== "string" ||
            body.description.length > 2000
        ) {
            errors.push("description must not exceed 2000 characters.");
        }
    }

    if (body.visibility !== undefined) {
        if (!VISIBILITIES.has(body.visibility)) {
            errors.push(
                "visibility must be either 'internal' or 'client'."
            );
        }
    }

    return errors;
}

async function projectExists(projectId) {
    const result = await pool.query(
        `SELECT id, assigned_developer_id
         FROM public.projects
         WHERE id = $1
         LIMIT 1`,
        [projectId]
    );

    return result.rows[0] || null;
}

async function getDocumentById(id, profile) {
    const scope = getDocumentScope(profile, "$2");

    const result = await pool.query(
        `${DOCUMENT_SELECT}
         WHERE d.id = $1
           AND ${scope.clause}
         LIMIT 1`,
        [id, ...scope.params]
    );

    return result.rows[0] || null;
}

// --------------------------------------------------
// UPLOAD ACTUAL FILE
// POST /api/v1/documents/upload
//
// The file is sent as the raw request body. Metadata is supplied
// through query parameters. This avoids adding a multipart dependency.
// --------------------------------------------------

router.post(
    "/upload",
    requireDocumentManager,
    express.raw({
        type: "*/*",
        limit: MAX_FILE_SIZE
    }),
    async (req, res) => {
        let storagePath = null;

        try {
            const projectId = req.query.project_id;
            const fileName =
                typeof req.query.file_name === "string"
                    ? req.query.file_name.trim()
                    : "";
            const description =
                typeof req.query.description === "string"
                    ? req.query.description.trim() || null
                    : null;
            const visibility =
                typeof req.query.visibility === "string"
                    ? req.query.visibility
                    : "internal";

            if (!isUuid(projectId)) {
                return res.status(400).json({
                    success: false,
                    message: "A valid project_id is required."
                });
            }

            if (!fileName || fileName.length > 255) {
                return res.status(400).json({
                    success: false,
                    message:
                        "A valid file_name between 1 and 255 characters is required."
                });
            }

            if (!VISIBILITIES.has(visibility)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "visibility must be either 'internal' or 'client'."
                });
            }

            if (
                description !== null &&
                description.length > 2000
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "description must not exceed 2000 characters."
                });
            }

            const project = await projectExists(projectId);

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found."
                });
            }

            if (
                req.profile.role === "developer" &&
                project.assigned_developer_id !== req.profile.id
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You can only upload documents for your assigned projects."
                });
            }

            if (!Buffer.isBuffer(req.body)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "The request must contain the file as its binary body."
                });
            }

            const mimeType =
                typeof req.headers["content-type"] === "string"
                    ? req.headers["content-type"]
                    : "";

            const uploadError = validateUpload(
                fileName,
                mimeType,
                req.body.length
            );

            if (uploadError) {
                return res.status(400).json({
                    success: false,
                    message: uploadError
                });
            }

            const extension = getFileExtension(fileName);
            const safeFileName =
                sanitiseFileName(fileName) ||
                `document.${extension}`;

            const effectiveMimeType =
                (mimeType || "").split(";")[0].trim().toLowerCase() ||
                MIME_BY_EXTENSION[extension] ||
                "application/octet-stream";

            storagePath =
                `${projectId}/${crypto.randomUUID()}-${safeFileName}`;

            const { error: uploadErrorFromStorage } =
                await supabase.storage
                    .from(DOCUMENTS_BUCKET)
                    .upload(storagePath, req.body, {
                        contentType: effectiveMimeType,
                        upsert: false
                    });

            if (uploadErrorFromStorage) {
                console.error(
                    "Supabase Storage upload failed:",
                    uploadErrorFromStorage.message
                );

                return res.status(502).json({
                    success: false,
                    message: "Unable to upload the document file."
                });
            }

            try {
                const result = await pool.query(
                    `INSERT INTO public.documents
                        (
                            project_id,
                            file_name,
                            storage_path,
                            mime_type,
                            size_bytes,
                            description,
                            visibility,
                            uploaded_by
                        )
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                     RETURNING id`,
                    [
                        projectId,
                        fileName,
                        storagePath,
                        effectiveMimeType,
                        req.body.length,
                        description,
                        visibility,
                        req.profile.id
                    ]
                );

                const document = await getDocumentById(
                    result.rows[0].id,
                    req.profile
                );

                let downloadUrl = null;

                try {
                    downloadUrl = await createDownloadUrl(
                        storagePath
                    );
                } catch (urlError) {
                    console.warn(
                        "Signed download URL creation failed:",
                        urlError.message
                    );
                }

                return res.status(201).json({
                    success: true,
                    message:
                        "Document uploaded successfully.",
                    document,
                    download_url: downloadUrl
                });
            } catch (databaseError) {
                // Prevent an orphaned Storage object if the metadata
                // insert fails.
                const { error: cleanupError } = await supabase.storage
                    .from(DOCUMENTS_BUCKET)
                    .remove([storagePath]);

                if (cleanupError) {
                    console.error(
                        "Storage cleanup failed:",
                        cleanupError.message
                    );
                }

                throw databaseError;
            }
        } catch (error) {
            console.error(
                "Upload document error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to complete the document upload."
            });
        }
    }
);

// --------------------------------------------------
// GET ALL DOCUMENTS
// --------------------------------------------------

router.get("/", async (req, res) => {
    try {
        const scope = getDocumentScope(req.profile);

        const result = await pool.query(
            `${DOCUMENT_SELECT}
             WHERE ${scope.clause}
             ORDER BY d.created_at DESC`,
            scope.params
        );

        return res.json({
            success: true,
            count: result.rows.length,
            documents: result.rows
        });
    } catch (error) {
        console.error("Get documents error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve documents."
        });
    }
});

// --------------------------------------------------
// GET SIGNED DOWNLOAD URL
// GET /api/v1/documents/:id/download
// --------------------------------------------------

router.get("/:id/download", async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID."
            });
        }

        const document = await getDocumentById(
            req.params.id,
            req.profile
        );

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found."
            });
        }

        const downloadUrl = await createDownloadUrl(
            document.storage_path
        );

        return res.json({
            success: true,
            document_id: document.id,
            file_name: document.file_name,
            download_url: downloadUrl,
            expires_in: 3600
        });
    } catch (error) {
        console.error(
            "Create document download URL error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create a secure download link."
        });
    }
});

// --------------------------------------------------
// GET DOCUMENT BY ID
// --------------------------------------------------

router.get("/:id", async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID."
            });
        }

        const document = await getDocumentById(
            req.params.id,
            req.profile
        );

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found."
            });
        }

        return res.json({
            success: true,
            document
        });
    } catch (error) {
        console.error("Get document error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the document."
        });
    }
});

// --------------------------------------------------
// CREATE DOCUMENT
// --------------------------------------------------

router.post("/", requireDocumentManager, async (req, res) => {
    try {
        const {
            project_id,
            file_name,
            storage_path,
            mime_type = null,
            size_bytes = null,
            description = null,
            visibility = "internal"
        } = req.body;

        if (!isUuid(project_id)) {
            return res.status(400).json({
                success: false,
                message: "A valid project_id is required."
            });
        }

        const errors = validateDocumentPayload(req.body);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid document data.",
                errors
            });
        }

        const project = await projectExists(project_id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        if (
            req.profile.role === "developer" &&
            project.assigned_developer_id !== req.profile.id
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only manage documents for your assigned projects."
            });
        }

        const result = await pool.query(
            `INSERT INTO public.documents
                (
                    project_id,
                    file_name,
                    storage_path,
                    mime_type,
                    size_bytes,
                    description,
                    visibility,
                    uploaded_by
                )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING id`,
            [
                project_id,
                file_name.trim(),
                storage_path.trim(),
                mime_type?.trim() || null,
                size_bytes,
                description,
                visibility,
                req.profile.id
            ]
        );

        const document = await getDocumentById(
            result.rows[0].id,
            req.profile
        );

        return res.status(201).json({
            success: true,
            message: "Document created successfully.",
            document
        });
    } catch (error) {
        console.error("Create document error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create the document."
        });
    }
});

// --------------------------------------------------
// UPDATE DOCUMENT
// --------------------------------------------------

router.patch("/:id", requireDocumentManager, async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID."
            });
        }

        const existing = await getDocumentById(
            req.params.id,
            req.profile
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Document not found."
            });
        }

        const errors = validateDocumentPayload(req.body, true);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid document data.",
                errors
            });
        }

        const allowedFields = [
            "file_name",
            "storage_path",
            "mime_type",
            "size_bytes",
            "description",
            "visibility"
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates.push(
                    `${field} = $${values.length + 1}`
                );

                let value = req.body[field];

                if (
                    typeof value === "string" &&
                    ["file_name", "storage_path", "mime_type"].includes(field)
                ) {
                    value = value.trim();
                }

                values.push(value);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields were supplied for update."
            });
        }

        values.push(req.params.id);

        await pool.query(
            `UPDATE public.documents
             SET ${updates.join(", ")},
                 updated_at = NOW()
             WHERE id = $${values.length}`,
            values
        );

        const document = await getDocumentById(
            req.params.id,
            req.profile
        );

        return res.json({
            success: true,
            message: "Document updated successfully.",
            document
        });
    } catch (error) {
        console.error("Update document error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update the document."
        });
    }
});

// --------------------------------------------------
// DELETE DOCUMENT
// --------------------------------------------------

router.delete("/:id", requireDocumentManager, async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID."
            });
        }

        const existing = await getDocumentById(
            req.params.id,
            req.profile
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Document not found."
            });
        }

        // Remove the binary file first. Legacy metadata-only rows may
        // point to paths that do not exist; in that case the DB record
        // can still be removed.
        if (existing.storage_path) {
            const { error: storageError } = await supabase.storage
                .from(DOCUMENTS_BUCKET)
                .remove([existing.storage_path]);

            if (storageError) {
                console.warn(
                    "Document storage cleanup warning:",
                    storageError.message
                );
            }
        }

        await pool.query(
            `DELETE FROM public.documents
             WHERE id = $1`,
            [req.params.id]
        );

        return res.json({
            success: true,
            message: "Document deleted successfully."
        });
    } catch (error) {
        console.error("Delete document error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete the document."
        });
    }
});

// Handle raw-upload size errors as JSON rather than Express' default HTML response.
router.use((error, req, res, next) => {
    if (error?.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "File size must not exceed 10 MB."
        });
    }

    return next(error);
});

module.exports = function createDocumentsRouter(requireAuth) {
    router.use(requireAuth);
    return router;
};