# AWS Deployment Guide

Console walkthrough for the full AWS setup: locking down FinBERT, wiring up
the EC2 auto start/stop lifecycle, and the IAM roles behind all of it.

Every screen below is region-scoped. Before starting, click the region
dropdown top-right and confirm it says **Europe (Frankfurt) eu-central-1**.

## Architecture

Two separate EC2 instances are involved — don't mix them up:

- **Frontend+backend instance** — runs `docker-compose` (frontend on 3000,
  backend on 8000), keeps a public IP so users can reach it. Its lifecycle
  (start on demand, auto-stop after 3 hours) is managed by the
  `start-ec2-instance` / `stop-ec2-instance` Lambdas and a Step Functions
  state machine.
- **FinBERT instance** — runs the FinBERT inference server (root
  `Dockerfile`, port 8080), private subnet, **no public IP at all**. Only the
  `invoke-finbert` Lambda can reach it, over its private IP. The backend
  never talks to FinBERT directly in production — it invokes `invoke-finbert`
  via IAM (`boto3`), which is the only thing authorized (network + IAM) to
  reach it.

```
Browser ──▶ Frontend+backend EC2 (public)
                  │  backend invokes invoke-finbert via IAM (boto3)
                  ▼
            invoke-finbert Lambda (VPC-attached)
                  │  proxies to private IP, port 8080
                  ▼
            FinBERT EC2 (private, no public IP)
```

### IAM roles at a glance

| Role | Trust policy | Permissions policy | Purpose |
|---|---|---|---|
| `start-ec2-instance-role` | `aws/iam/lambda-role-trust-policy.json` | `aws/iam/start-instance-policy.json` | Lets `start-ec2-instance` start/describe the **frontend+backend** instance only |
| `stop-ec2-instance-role` | `aws/iam/lambda-role-trust-policy.json` | `aws/iam/stop-instance-policy.json` | Lets `stop-ec2-instance` stop/describe the **frontend+backend** instance only |
| `invoke-finbert-role` | `aws/iam/lambda-role-trust-policy.json` | `aws/iam/invoke-finbert-role-ec2-policy.json` + AWS-managed `AWSLambdaVPCAccessExecutionRole` | Lets `invoke-finbert` start/describe the **FinBERT** instance and run inside its VPC |
| `ec2-lifecycle-role` | `aws/iam/ec2-lifecycle-role-trust-policy.json` | `aws/iam/step-functions-policy.json` | Lets the Step Functions state machine invoke the two lifecycle Lambdas |
| Backend's role (name varies) | `aws/iam/ec2-instance-role-trust-policy.json` (if creating fresh) | `aws/iam/backend-invoke-finbert-policy.json` + `aws/iam/backend-data-access-policy.json` | Lets the backend invoke `invoke-finbert` and read/write its DynamoDB tables + S3 bucket |
| FinBERT instance's own role | `aws/iam/ec2-instance-role-trust-policy.json` | AWS-managed `AmazonSSMManagedInstanceCore` | Lets you manage the FinBERT instance via Session Manager (no SSH, no public IP needed) |
| CodeBuild's role (if used) | — | `aws/iam/codebuild-policy.json` | Lets CI zip/deploy `start-ec2-instance`/`stop-ec2-instance` code |

Trust-policy files aren't something you paste anywhere — picking **Trusted
entity type: AWS service** in the console generates the exact same document.
They're here for version control/audit, and because the same trust document
is shared across every role of a given type (all Lambda roles trust
`lambda.amazonaws.com`; all EC2 instance roles trust `ec2.amazonaws.com`).

**Known gap:** nothing currently calls `states:StartExecution` on the
lifecycle state machine — there's no DNS/API Gateway/Function URL wired up
yet to kick it off. That's follow-up work once you're ready to build the
DNS-facing entry point (its own IAM policy, scoped to `states:StartExecution`
on that one state machine ARN).

---

## 1. Security groups (VPC console)

1. Top search bar → `VPC` → click the **VPC** service result.
2. Left sidebar → **Security groups** → **Create security group**.
3. Fill in:
   - **Name**: `lambda-sg`
   - **Description**: `Lambda that proxies requests to FinBERT`
   - **VPC**: the VPC your FinBERT instance is (or will be) in
4. Leave **Inbound rules** empty. Leave **Outbound rules** default (`All traffic` to `0.0.0.0/0` — fine, it only controls what the Lambda can reach).
5. **Create security group**.
6. Create a second one:
   - **Name**: `finbert-sg`
   - **Description**: `FinBERT EC2 instance, backend-lambda-only`
   - **VPC**: same as above
7. **Inbound rules** → **Add rule**: Type `Custom TCP`, Port `8080`, Source → type **Custom**, type `lambda-sg`, select it from the dropdown.
8. Leave outbound default. **Create security group**.

---

## 2. VPC interface endpoints for SSM (private subnet, no NAT gateway)

The FinBERT instance has no public IP and no NAT gateway, so it needs three
VPC interface endpoints for the SSM agent to reach AWS Systems Manager — this
is how you'll access the instance (Session Manager) instead of SSH.

1. VPC console → **Endpoints** → **Create endpoint**.
2. **Name tag**: `ssm-endpoint`. **Service category**: `AWS services`.
3. **Services**: search `ssm` → select `com.amazonaws.eu-central-1.ssm` (Type: `Interface`).
4. **VPC**: same VPC as `finbert-sg`. **Subnets**: the private subnet(s) FinBERT is (or will be) in.
5. **Security groups**: **Create new security group** → name `ssm-endpoints-sg`, inbound rule: `HTTPS` (443) from source `finbert-sg`.
6. **Policy**: leave `Full access`. **Create endpoint**.
7. Repeat for `com.amazonaws.eu-central-1.ssmmessages` and `com.amazonaws.eu-central-1.ec2messages` — same VPC, subnets, `ssm-endpoints-sg`.
8. Confirm **Private DNS names enabled** stays checked on all three.

Each endpoint has a small hourly + per-GB cost — cheaper than a NAT gateway for occasional Session Manager access.

---

## 3. FinBERT EC2 instance

### 3a. Create its IAM instance profile (for Session Manager access)

1. IAM console → **Roles** → **Create role** → **Trusted entity type**: `AWS service` → **Use case**: `EC2` → **Next**. (Trust matches `aws/iam/ec2-instance-role-trust-policy.json`.)
2. Check the AWS-managed policy `AmazonSSMManagedInstanceCore`.
3. **Role name**: `finbert-instance-role` → **Create role**.

### 3b. Launch the instance

1. EC2 console → **Launch instance**. **Name**: `finbert-instance`.
2. **AMI**: your usual choice. **Instance type**: size for the model memory footprint — `backend_finbert` loads two German models plus an English FinBERT model, budget at least 8 GB RAM to start (e.g. `t3.large`), adjust after watching real usage.
3. **Key pair**: select **Proceed without a key pair (Not recommended)** — access is via Session Manager, not SSH.
4. **Network settings** → **Edit**: VPC = the one with `finbert-sg`; **Subnet** = the private subnet from section 2; **Auto-assign public IP**: `Disable`; **Firewall (security groups)**: select existing → `finbert-sg`.
5. **Advanced details** → **IAM instance profile**: `finbert-instance-role`.
6. **Launch instance**.

If the instance already exists without this role attached: EC2 console →
**Instances** → select it → **Actions** → **Security** → **Modify IAM role**
→ pick `finbert-instance-role` → **Update IAM role**. No relaunch needed.

Give the SSM agent a minute or two to register (needs the role + the VPC
endpoints from section 2 both in place), then check Systems Manager console
→ **Fleet Manager** to confirm it shows up, and connect via **Session
Manager**.

### 3c. Deploy the FinBERT app onto it

The repo's root `Dockerfile` builds the FinBERT server
(`backend_finbert/server.py`, port 8080). Once connected via Session Manager:

1. Install Docker on the instance if it isn't already (`sudo yum install -y docker && sudo systemctl start docker`, or the Ubuntu/apt equivalent depending on your AMI).
2. Build and push the image from your machine (or a CI pipeline) — see the "Building & pushing images" section in `README.md` for the exact tags currently in use.
3. On the instance: `docker pull <image>`, then run it with the `.env` values it needs (`HF_TOKEN` at minimum — see `backend_finbert/.env.example`):
   ```sh
   docker run -d --name finbert --restart unless-stopped \
     --env-file /path/to/.env \
     -p 8080:8080 \
     <your-image>:<tag>
   ```
4. Confirm it's up: `curl http://localhost:8080/health` from the instance itself.

### 3d. Lock down its security group and confirm no public IP

1. EC2 console → **Instances** → select the FinBERT instance.
2. **Actions** → **Security** → **Change security groups** → remove anything that isn't `finbert-sg`, add `finbert-sg`. **Save**.
3. Check **Public IPv4 address** on the instance detail page:
   - **Elastic IP present**: **Elastic IPs** → select it → **Actions → Disassociate** → confirm → **Actions → Release** → confirm.
   - **Public IP but no Elastic IP** (auto-assigned): can't be removed from a running instance. Either launch a replacement in a private subnet with auto-assign disabled (redeploy the app per 3c), or if the subnet itself has "Auto-assign public IPv4 address" enabled, turn that off (**VPC console → Subnets → Actions → Edit subnet settings**) then stop/start (not reboot) the instance.
4. Once private, copy the **Instance ID** — you'll need it in section 4.

---

## 4. `invoke-finbert` Lambda

### 4a. Its IAM role

1. IAM console → **Policies** → **Create policy** → **JSON** tab.
2. Paste `aws/iam/invoke-finbert-role-ec2-policy.json`, replacing `<YOUR_FINBERT_INSTANCE_ID>` with the ID from section 3d. **Next**.
3. **Policy name**: `invoke-finbert-role-ec2-policy` → **Create policy**.
4. **Roles** → **Create role** → **Trusted entity type**: `AWS service` → **Use case**: `Lambda` → **Next**. (Trust matches `aws/iam/lambda-role-trust-policy.json`.)
5. Check `invoke-finbert-role-ec2-policy` and the AWS-managed `AWSLambdaVPCAccessExecutionRole` (needed to create network interfaces in the VPC).
6. **Role name**: `invoke-finbert-role` → **Create role**.

### 4b. Create the function

1. Lambda console → **Create function** → **Author from scratch**.
2. **Function name**: `invoke-finbert`. **Runtime**: `Python 3.12`. **Architecture**: `x86_64`.
3. **Change default execution role** → **Use an existing role** → `invoke-finbert-role`. **Create function**.
4. **Code** tab: rename `lambda_function.py` to `invoke_finbert.py`, paste in the contents of `aws/lambda/invoke_finbert.py`. **Deploy**.
5. **Configuration** → **Runtime settings** → **Edit** → **Handler**: `invoke_finbert.lambda_handler` → **Save**.
6. **Configuration** → **General configuration** → **Edit** → **Memory**: `256` MB, **Timeout**: `6 min 40 sec` (400s — covers a slow EC2 boot plus inference) → **Save**.
7. **Configuration** → **VPC** → **Edit** → **VPC**: same as FinBERT's; **Subnets**: the private subnet; **Security groups**: `lambda-sg` → **Save** (provisions an ENI, can take 1–2 min).
8. **Configuration** → **Environment variables** → **Edit** → add:

   | Key | Value |
   |---|---|
   | `INSTANCE_ID` | FinBERT's instance ID (section 3d) |
   | `FINBERT_PORT` | `8080` |
   | `AWS_REGION` | `eu-central-1` |
   | `FINBERT_TIMEOUT_S` | `240` |

---

## 5. Lock down who can invoke `invoke-finbert`

Two separate IAM pieces, both required — neither is sufficient alone.

### 5a. Identity policy on the backend's role

1. Find the backend's role: EC2 console → the backend instance → **Security** tab → **IAM Role**.
2. IAM console → **Roles** → open it → **Add permissions** → **Create inline policy** → **JSON** tab.
3. Paste `aws/iam/backend-invoke-finbert-policy.json`. If the ARN doesn't match your account/function, edit `Resource` to `arn:aws:lambda:eu-central-1:<your-account-id>:function:invoke-finbert`.
4. **Policy name**: `backend-invoke-finbert-policy` → **Create policy**.

### 5b. Resource policy on the Lambda itself

Without this, any other principal in the account holding a broad
`lambda:InvokeFunction: "*"` policy elsewhere could still invoke it.

1. Lambda console → `invoke-finbert` → **Configuration** → **Permissions** → **Resource-based policy statements** → **Add permissions**.
2. **Policy statement type**: `AWS Account`. **Statement ID**: `AllowBackendRoleOnly`.
3. **Principal**: the backend role's full ARN (`arn:aws:iam::<account-id>:role/<backend-role-name>`).
4. **Action**: `lambda:InvokeFunction` → **Save**.
5. If the console rejects a role ARN in Principal (it's built mainly for account IDs/service principals), use CloudShell instead:
   ```sh
   aws lambda add-permission \
     --function-name invoke-finbert \
     --statement-id AllowBackendRoleOnly \
     --action lambda:InvokeFunction \
     --principal arn:aws:iam::<account-id>:role/<backend-role-name> \
     --region eu-central-1
   ```

### 5c. Do not add a public entry point

Confirm the Lambda's **Function overview** shows no trigger boxes (no API
Gateway, no Function URL). If a Function URL is ever needed for something
else, it must use `AuthType: AWS_IAM` and grant `lambda:InvokeFunctionUrl`
only to the backend's role — never `AuthType: NONE`.

---

## 6. Backend environment variables

The backend runs via `docker-compose` on its own EC2 instance — the `backend`
service reads config from a `.env` file (`env_file: - .env` in
`docker-compose.yml`), sitting next to the compose file on that box. Add:

```
FINBERT_LAMBDA_NAME=invoke-finbert
AWS_REGION=eu-central-1
```

1. Connect to the backend's instance the way you normally do (it keeps a public IP, so regular SSH with your key pair applies here — unlike FinBERT).
2. Open (or create) the `.env` file next to `docker-compose.yml`.
3. Add the two lines above.
4. `docker-compose up -d --force-recreate backend` — a plain `restart` does **not** reload `.env` changes.
5. Confirm: `docker-compose exec backend env | grep -E "FINBERT_LAMBDA_NAME|AWS_REGION"`.

This depends on the backend's IAM role (section 5a, plus DynamoDB/S3 access
below) already being attached — `boto3` picks up credentials automatically
via the EC2 metadata service, no access keys belong in `.env`.

### Backend's data-access policy

The backend also needs DynamoDB (`developer-sentiment-analysis-outputs`,
`sentiment_document_data`) and S3 (`articles-sentiment`) access, which isn't
covered above. On the same role as 5a:

1. **Add permissions** → **Create inline policy** → **JSON** tab.
2. Paste `aws/iam/backend-data-access-policy.json`.
3. **Policy name**: `backend-data-access` → **Create policy**.

---

## 7. Frontend+backend EC2 lifecycle (start/stop Lambdas + Step Functions)

This manages the **frontend+backend instance** specifically — not FinBERT.

### 7a. `start-ec2-instance` Lambda's role

1. IAM console → **Policies** → **Create policy** → paste `aws/iam/start-instance-policy.json` → **Policy name**: `start-instance-ec2-policy`.
2. **Roles** → **Create role** → `AWS service` → `Lambda` → check `start-instance-ec2-policy` → **Role name**: `start-ec2-instance-role`. (Trust matches `aws/iam/lambda-role-trust-policy.json`.)
3. Lambda console → create (or open) the `start-ec2-instance` function: **Author from scratch**, runtime `Python 3.12`, paste `aws/lambda/start_instance.py`, handler `start_instance.lambda_handler`.
4. **Execution role** → `start-ec2-instance-role`.
5. **Environment variables** → `INSTANCE_ID` = the frontend+backend instance's ID.
6. **General configuration** → **Timeout**: at least `3 min 0 sec` (the `instance_running` waiter can take 60–90s).

### 7b. `stop-ec2-instance` Lambda's role

Same pattern: `aws/iam/stop-instance-policy.json` → policy `stop-instance-ec2-policy` → role `stop-ec2-instance-role` (same trust policy) → function using `aws/lambda/shutdown_instance.py`, handler `shutdown_instance.lambda_handler`, same `INSTANCE_ID` env var.

### 7c. Step Functions state machine

1. Create its role first: **Roles** → **Create role** → `AWS service` → **Use case**: `Step Functions` → **Role name**: `ec2-lifecycle-role`. (Trust matches `aws/iam/ec2-lifecycle-role-trust-policy.json`.)
2. Create a policy from `aws/iam/step-functions-policy.json`, name it `ec2-lifecycle-invoke-policy`, attach to `ec2-lifecycle-role`.
3. Step Functions console → **Create state machine** → **Write your workflow in code** → paste `aws/step-functions/ec2-lifecycle.json`.
4. **Type**: `Standard`. **Permissions**: `ec2-lifecycle-role`. **Name**: `ec2-lifecycle` → **Create**.

The state machine invokes `start-ec2-instance`, waits 3 hours, then invokes
`stop-ec2-instance` — no separate boot-wait step is needed since
`start-ec2-instance` already blocks on its own `instance_running` waiter
before returning.

### 7d. CI role for deploying these two Lambdas (if using CodeBuild)

`buildspec.yml` zips and deploys `start_instance.py`/`shutdown_instance.py`
via CodeBuild. If you're using it: create a role trusted by
`codebuild.amazonaws.com`, attach a policy built from
`aws/iam/codebuild-policy.json`. Note `.github/workflows/deploy-lambdas.yml`
does the same deploy via GitHub Actions instead — if both are active, decide
which one is actually driving deploys to avoid the two racing each other.

---

## 8. Verify

1. **FinBERT lockdown**: CloudWatch → **Log groups** → `/aws/lambda/invoke-finbert` → log into the site, click **Analyze Sentiment**, confirm a new log stream appears.
2. **No public IP**: EC2 console → FinBERT instance → **Public IPv4 address** is empty.
3. **Access denied for other roles**: IAM console → open any role that isn't the backend's role → **Policy simulator** → service `Lambda`, action `InvokeFunction`, resource `arn:aws:lambda:eu-central-1:<account-id>:function:invoke-finbert` → should show **denied**.
4. **Lifecycle**: Step Functions console → **Start execution** (`{}`) → `StartEC2` turns green once `start-ec2-instance` returns, sits in `Wait3Hours`, then `StopEC2` fires. Check `/aws/lambda/start-ec2-instance` and `/aws/lambda/stop-ec2-instance` log groups for the new streams, and confirm the instance transitions to `running` in the EC2 console.
5. **Rescoped permissions**: `invoke-finbert-role` → Policy simulator → `ec2:StopInstances` should show **implicitly denied** (no longer granted). Backend's role → `dynamodb:PutItem` on `developer-sentiment-analysis-outputs` → **allowed**.
6. **End-to-end**: on the site, log in, go to Analyze, paste text, click **Analyze Sentiment**, confirm a result comes back within the timeout window.
