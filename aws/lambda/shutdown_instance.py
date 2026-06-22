import boto3
import json

ec2 = boto3.client('ec2', region_name='eu-central-1')

def lambda_handler(event, context):
    """
    Lambda 2: Stop EC2 instance after 3 hours.
    
    This function is triggered by CloudWatch Events or Step Functions
    to shut down the EC2 instance.
    """
    # Get instance ID from environment or use default
    instance_id = 'i-your-instance-id'  # Replace with your actual instance ID
    
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