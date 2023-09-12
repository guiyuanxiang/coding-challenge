import React, {useState} from 'react';
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import './App.css';

const {LambdaClient, InvokeCommand} = require("@aws-sdk/client-lambda");


// // 配置AWS SDK
// const config = new Configuration({
//     region: 'YOUR_REGION', // 替换为您的AWS区域
// });
const react_app_accesskeyid = process.env.REACT_APP_ACCESSKEYID;
const react_app_secretaccesskey = process.env.REACT_APP_SECRETACCESSKEY;


const upload_success = '上传成功';
const upload_fail = '上传失败';
const toast = '请输入文本和选择文件';
const bucket = 'codechallengeganbdadei';
const region = 'us-east-1';
const functionName = 'myFunction';

const s3Client = new S3Client({
    region: region,
    credentials: {
        accessKeyId: react_app_accesskeyid,
        secretAccessKey: react_app_secretaccesskey,
    }
    // ...config,
});
const lambdaClient = new LambdaClient({
    region: region, // 替换为 Lambda 所在的 AWS 区域
    credentials: {
        accessKeyId: react_app_accesskeyid,
        secretAccessKey: react_app_secretaccesskey,
    }
});

const uploadFile = async (input, filename) => {
    try {
        const filePath = bucket.concat('/').concat(filename);
        const body = {
            input_file_path: filePath,
            input_text: input,
            // 添加其他字段和数据...
        };

        const dataToSend = {
            body: body
        };

        const params = {
            FunctionName: functionName, // 替换为 Lambda 函数的名称
            Payload: JSON.stringify(dataToSend), // 传递给 Lambda 函数的输入数据
        };

        const command = new InvokeCommand(params);

        try {
            const response = await lambdaClient.send(command);
            console.log("Lambda Response:", response.Payload.toString());
        } catch (error) {
            console.error("Error calling Lambda:", error);
        }

    } catch (error) {
        console.error('Error uploading file:', error);
    }
};

function App() {
    console.log(react_app_accesskeyid);
    const [inputText, setInputText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const handleTextChange = (e) => {
        setInputText(e.target.value);
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async () => {
        if (!inputText || !selectedFile) {
            alert(toast);
            return;
        }


        // 上传文件到S3
        const fileParams = {
            Bucket: bucket,
            Key: selectedFile.name,
            Body: selectedFile,
        };
        console.log(fileParams);

        try {
            await s3Client.send(new PutObjectCommand(fileParams));
            await uploadFile(inputText, selectedFile.name);
            alert(upload_success);
        } catch (error) {
            console.error(upload_fail, error);
        }


    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-semibold mb-4">响应式 UI 示例</h1>

                <div className="mb-4">
                    <label className="block mb-2">文本输入:</label>
                    <input
                        type="text"
                        value={inputText}
                        onChange={handleTextChange}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="mb-4">
                    <label className="block mb-2">文件输入:</label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                >
                    提交
                </button>
            </div>
        </div>
    );
}

export default App;