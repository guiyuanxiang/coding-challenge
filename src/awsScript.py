import sys
import boto3

# 获取命令行参数，sys.argv[0] 是脚本名称，sys.argv[1:] 包含所有其他参数
args = sys.argv[1:]
print(args)
bucketName = args[0]
print(bucketName)
id = args[1]
table_name = args[2]
aws_access_key_id = args[3]
aws_secret_access_key = args[4]

region = 'us-east-1'

dynamodb = boto3.client('dynamodb', region_name=region)  # 替换为您的区域
s3 = boto3.client('s3', region_name=region)  # 替换为您的区域和 S3 存储桶名
item_id = id  # 替换为要检索的项目ID

# 步骤 1：从 DynamoDB 表中获取数据
response = dynamodb.get_item(
    TableName=table_name,
    Key={'id': {'S': item_id}}  # 使用 S 表示字符串类型
)
print(response['Item'])
# 从 DynamoDB 响应中提取 inputText
input_text = response['Item']['input_text']['S'] if 'Item' in response else ''
filePath = response['Item']['input_file_path']['S'] if 'Item' in response else ''

# 步骤 2：从 S3 下载文件

bucket_name = bucketName  # 替换为您的 S3 存储桶名
input_file_key = filePath  # 替换为要下载的文件键
split = input_file_key.split('/')
fine_name = split[1]
downloaded_file_path = '/tmp/' + fine_name  # 下载到本地的文件路径

s3.download_file(bucket_name, fine_name, downloaded_file_path)

# 步骤 3：读取文件并将 inputText 拼接在文件后面
with open(downloaded_file_path, 'a') as file:
    file.write(f': {input_text}')

# 步骤 4：上传文件至 S3
output_file_key = 'out' + fine_name  # 替换为要上传的文件键

s3.upload_file(downloaded_file_path, bucket_name, output_file_key)

print(f'文件已上传至 S3 存储桶：s3://{bucket_name}/{output_file_key}')
# 步骤 5： 将上传后的路径作为 output_file_path字段，更新 DynamoDB 表 的这条数据
output_file_path = bucket_name + '/' + output_file_key

response = dynamodb.update_item(
    TableName=table_name,
    Key={'id': {'S': item_id}},
    UpdateExpression='SET output_file_path = :path',
    ExpressionAttributeValues={':path': {'S': output_file_path}}
)

# 打印响应
print("UpdateItem succeeded:", response)
