import boto3
import json
import os

ec2 = boto3.client('ec2', region_name='eu-central-1')

def lambda_handler(event, context):
    """
    Lambda 2: Stop EC2 instance after 3 hours.

    This function is triggered by Step Functions to shut down the EC2 instance.

    Required environment variables:
        INSTANCE_ID: The EC2 instance ID to stop (e.g. i-0abc123def456)
    """
    instance_id = os.environ['INSTANCE_ID']
    
    try:
        # Stop the instance
        ec2.stop_instances(InstanceIds=[instance_id])
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True
            },
            'body': json.dumps({
                'message': 'Instance stopped successfully',
                'instance_id': instance_id
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }