# 04 - Modules and Ownership

| Area | Purpose | Primary path |
| --- | --- | --- |
| `core` | HttpClient, retry/error handling, common types, pagination, and signed uploads. | `posty5-core/src` |
| `short-link` | Short-link CRUD/list client. | `posty5-short-link/src` |
| `qr-code` | Seven QR types with create/update/get/list/delete. | `posty5-qr-code/src` |
| `html-hosting` | File/GitHub create/update and hosting management. | `posty5-html-hosting/src` |
| `html-hosting-variables` | pst5_-prefixed hosting variable CRUD/list. | `posty5-html-hosting-variables/src` |
| `html-hosting-form-submission` | Submission get/navigation/list/status/delete. | `posty5-html-hosting-form-submission/src` |
| `social-publisher-workspace` | Workspace CRUD/list and signed logo upload. | `posty5-social-publisher-workspace/src` |
| `social-publisher-post` | Video/image publishing, upload orchestration, status and list. | `posty5-social-publisher-post/src` |

## Editing rule

Start changes in the owning module. Move code to shared/core only after more than one feature genuinely owns the behavior. Update this file and [MODULE_INDEX.json](MODULE_INDEX.json) when ownership changes.
