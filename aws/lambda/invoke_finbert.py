import boto3
import json
import os
import urllib.request
import urllib.error

ec2 = boto3.client('ec2', region_name=os.environ.get('AWS_REGION', 'eu-central-1'))

INSTANCE_ID = os.environ.get('INSTANCE_ID')
FINBERT_PORT = os.environ.get('FINBERT_PORT', '8080')
REQUEST_TIMEOUT_S = float(os.environ.get('FINBERT_TIMEOUT_S', '240'))


def _ensure_instance_running() -> str:
    """Start the FinBERT EC2 instance if it isn't already running, return its private IP.

    Uses the private IP (not a public one) because this Lambda is deployed inside
    the same VPC as the FinBERT instance. FinBERT should not have a public IP at
    all - its security group only needs to allow inbound traffic from this
    Lambda's security group.
    """
    resp = ec2.describe_instances(InstanceIds=[INSTANCE_ID])
    instance = resp['Reservations'][0]['Instances'][0]
    state = instance['State']['Name']

    if state not in ('running', 'pending'):
        ec2.start_instances(InstanceIds=[INSTANCE_ID])

    if state != 'running':
        waiter = ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=[INSTANCE_ID])
        resp = ec2.describe_instances(InstanceIds=[INSTANCE_ID])
        instance = resp['Reservations'][0]['Instances'][0]

    private_ip = instance.get('PrivateIpAddress')
    if not private_ip:
        raise RuntimeError(f"Instance {INSTANCE_ID} has no private IP address")
    return private_ip


def lambda_handler(event, context):
    """
    Proxies a sentiment-analysis request to the FinBERT EC2 instance.

    This function is meant to be invoked directly via boto3 (lambda:InvokeFunction),
    e.g. from the FastAPI backend's IAM role - never through a public API Gateway
    route or a Lambda Function URL. Access is locked down via this function's
    resource-based policy so that only the backend's IAM role may invoke it
    (see AWS_DEPLOYMENT.md section 5 for the `add-permission` call,
    and aws/iam/backend-invoke-finbert-policy.json for the matching identity policy
    on the backend's role).

    Because only this Lambda is authorized (network + IAM) to reach FinBERT,
    FinBERT itself can live in a private subnet with no public IP.

    Expected event payload:
        {"sentences": ["First sentence.", "Second sentence."], "language": "en"}

    Returns:
        {"ok": True, "results": [{"score": 0.42, "sentence": "..."}, ...]}
        {"ok": False, "error": "..."}
    """
    try:
        sentences = event.get('sentences')
        language = event.get('language', 'en')

        if not sentences or not isinstance(sentences, list):
            return {'ok': False, 'error': "event['sentences'] must be a non-empty list"}

        if not INSTANCE_ID:
            return {'ok': False, 'error': 'INSTANCE_ID environment variable is not set'}

        private_ip = _ensure_instance_running()

        payload = json.dumps({'sentences': sentences, 'language': language}).encode('utf-8')
        req = urllib.request.Request(
            url=f'http://{private_ip}:{FINBERT_PORT}/predict',
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST',
        )

        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_S) as resp:
            data = json.loads(resp.read().decode('utf-8'))

        if 'results' not in data or not isinstance(data['results'], list):
            return {'ok': False, 'error': f'Invalid response from FinBERT: {data}'}

        return {'ok': True, 'results': data['results']}

    except urllib.error.URLError as e:
        return {'ok': False, 'error': f'Could not reach FinBERT instance: {e}'}
    except Exception as e:
        return {'ok': False, 'error': str(e)}
