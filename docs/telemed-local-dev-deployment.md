# Deploy Telemed Dev from your machine

This follows the HealthX front v1 approach: use your Azure CLI login, build in
Azure Container Registry, then update the existing Container App. It does not
require GitHub OIDC or an AZURE_CLIENT_ID. It is not automatic GitHub deployment.

From the Telemed repository:

```sh
az login
bash deployment/deploy-dev.sh --check-only
bash deployment/deploy-dev.sh
```

Requires Azure CLI (with Container Apps support) and Python 3. No local Docker
daemon is required. The account must be authorized to run ACR builds, read image
metadata, and update the Telemed Dev app. This does not bypass Azure RBAC.
It also needs permission to read backend/frontend Container App secret values
and write frontend secrets. It never modifies backend settings or permissions.

The target is locked to `healthx-clinic-app-dev/healthx-telemed-web` in the project
subscription, with images in `healthxregistry.azurecr.io/healthx-telemed-web`.
Each build gets a unique `dev-local-...` tag; deployment uses the resolved digest.
The script validates ingress, runtime environment, image repository, and revision
mode before building. Runtime values are read from `deployment/environment/dev.env`
and applied with `--set-env-vars` in the same revision as the image update, like
backend v1. Unlisted Azure env values and secrets are preserved. `deployment/dev.env`
contains deployment target settings, not application runtime settings.

The runtime file uses `KEY=value`, optional quotes, and comments. It is parsed as
data, not sourced as shell code. Only `TELEMED_` keys are allowed, and Dev origins
are validated. Secret variables must use `secretref:NAME`. With the checked-in
`TELEMED_DEMO_AUTH_ENABLED=true`, the script automatically:

- reads the Dev backend's configured bridge secret and copies it to the frontend;
- creates a random session secret only if absent (existing sessions are preserved);
- sets `TELEMED_DEV_ORIGINS` to the frontend Container App's HTTPS FQDN;
- applies the secret references with the runtime environment on the new revision.

No secret values are printed, stored in the repo, or added to the Docker image.
Secret values are held in process memory and passed to Azure CLI; do not run with
shell tracing or on a shared, untrusted host. Existing invalid session secrets or
unresolvable Key Vault references cause a failure rather than automatic rotation.
Custom domains are not automatically allowed. This enables **Dev mock OTP only**,
not real phone verification, and must not be used for production patient signup.
Set `TELEMED_DEMO_AUTH_ENABLED=false` to leave mock registration disabled.

`--check-only` reads Azure configuration and secrets to validate the plan, but
does not build, write secrets, or update any app. It does not verify write permissions.
The normal command incurs ACR build costs and changes the Dev application's image
and the runtime variables explicitly listed in the file.
It builds the current local working tree, including uncommitted application edits.
The Docker build context excludes local env files and credentials.

GitHub workflows remain unchanged. Their automatic deployment still requires an
authorized pipeline identity. Production deployment is not supported by this script.
