const express = require("express");
const pool = require("../config/database");

const router = express.Router();

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VISIBILITIES = new Set(["internal", "client"]);

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

module.exports = function createDocumentsRouter(requireAuth) {
    router.use(requireAuth);
    return router;
};