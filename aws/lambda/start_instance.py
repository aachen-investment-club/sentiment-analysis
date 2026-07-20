import boto3
import json
import os

ec2 = boto3.client('ec2', region_name='eu-central-1')

instance_id = os.environ.get('INSTANCE_ID')

def lambda_handler(event, context):
    """
    Lambda 1: Start EC2 instance and return the application URL.

    This function:
    1. Starts the EC2 instance
    2. Waits for it to be in 'running' state
    3. Returns the public URL for the frontend

    Required environment variables:
        INSTANCE_ID: The EC2 instance ID to start (e.g. i-0abc123def456)

    Note: Set Lambda timeout to at least 3 minutes — the instance_running
    waiter can block for 60-90s and will cause a timeout with the default 3s limit.
    """
    
    try:
        # Start the instance
        ec2.start_instances(InstanceIds=[instance_id])
        
        # Wait for instance to be running
        waiter = ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=[instance_id])
        
        # Get public IP
        response = ec2.describe_instances(InstanceIds=[instance_id])
        public_ip = response['Reservations'][0]['Instances'][0].get('PublicIpAddress')
        
        if public_ip:
            url = f"http://{public_ip}:3000"
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': True
                },
                'body': json.dumps({
                    'url': url,
                    'status': 'running',
                    'instance_id': instance_id
                })
            }
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'No public IP assigned'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }