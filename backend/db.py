import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb', region_name='eu-north-1')

def get_table(table_name):
    return dynamodb.Table(table_name)

def save_user(table_name, user_data):
    """
    Save user data to DynamoDB using email as the key.
    user_data must include an 'email' field.
    """
    table = get_table(table_name)
    response = table.put_item(Item=user_data)
    return response

def get_user(table_name, email):
    """
    Retrieve user data from DynamoDB by email.
    """
    table = get_table(table_name)
    try:
        response = table.get_item(Key={'email': email})
        return response.get('Item')
    except ClientError as e:
        print(e.response['Error']['Message'])
        return None

if __name__ == "__main__":
    # Replace with your actual table name if different
    TABLE_NAME = "users-data"
    test_user = {
        "email": "testuser@example.com",
        "name": "Test User",
        "age": 30,
        "weight": 70,
        "height": 175
    }

    print("Saving user...")
    save_resp = save_user(TABLE_NAME, test_user)
    print("Save response:", save_resp)

    print("Retrieving user...")
    user = get_user(TABLE_NAME, "testuser@example.com")
    print("Retrieved user:", user)
