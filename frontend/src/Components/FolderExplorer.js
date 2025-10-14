import React, { useEffect, useState } from 'react';
import { Breadcrumb, Spin, message, Button } from 'antd';
import { FileOutlined, FolderOutlined } from '@ant-design/icons';
import Alert from './Alert';

const PYTHON_API_BASE = process.env.REACT_APP_API_BASE_URL_P;

const S3FileExplorer = ({ accessKey, secretKey, bucketName, onUUIDsGenerated, onVidDur, onUploadComplete }) => {
    const [items, setItems] = useState([]); // Holds files and folders in the current path
    const [currentPath, setCurrentPath] = useState(''); // Current folder path
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]); // Tracks selected files/folders
    const [isUploading, setIsUploading] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('');
    const [alertVisible, setAlertVisible] = useState(false);

    const fetchS3Data = async (path = '') => {
        setLoading(true);
        try {
            const response = await fetch(
                `${PYTHON_API_BASE}/api/s3/fetch-s3?accessKey=${accessKey}&secretKey=${secretKey}&bucketName=${bucketName}&prefix=${path}`
            );
            const data = await response.json();

            const folders = data.folders.map((folder) => ({
                name: folder.replace(path, '').replace('/', ''),
                key: folder,
                type: 'folder',
            }));
            const files = data.files.map((file) => ({
                name: file.replace(path, ''),
                key: file,
                type: 'file',
            }));

            setItems([...folders, ...files]);
        } catch (err) {
            console.error('Error fetching S3 data:', err);
            setAlertMessage('Failed to fetch S3 data.');
            setAlertType('error');
            setAlertVisible(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch S3 data if we have valid credentials
        if (accessKey && secretKey && bucketName) {
            fetchS3Data(currentPath);
        }
    }, [currentPath, accessKey, secretKey, bucketName]);

    const handleBreadcrumbClick = (path) => {
        setCurrentPath(path);
    };

    const handleDoubleClick = (item) => {
        if (item.type === 'folder') {
            setCurrentPath(item.key);
        }
    };

    const handleSingleClick = (item) => {
        if (selectedItems.includes(item.key)) {
            setSelectedItems(selectedItems.filter((key) => key !== item.key));
        } else {
            setSelectedItems([...selectedItems, item.key]);
        }
    };



    const handleFileUploadS3 = async () => {
        if (selectedItems.length === 0) {
            setAlertMessage('Please select at least one file or folder to upload.');
            setAlertType('warning');
            setAlertVisible(true);
            return;
        }

        if (!accessKey || !secretKey || !bucketName) {
            setAlertMessage('Access Key, Secret Key, and Bucket Name are required.');
            setAlertType('error');
            setAlertVisible(true);
            return;
        }

        setIsUploading(true);
        try {
            const allParentUUIDs = [];
            let totalVideoDuration = 0; 
            // Iterate over selected items and send each to the API
            for (const folderName of selectedItems) {
                const response = await fetch(`${PYTHON_API_BASE}/upload_folder`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        access_key: accessKey,
                        secret_key: secretKey,
                        bucket_name: bucketName,
                        folder_name: folderName,
                    }),
                });

                const result = await response.json();

                if (response.ok) {
                    setAlertMessage('File uploaded successfully');
                    setAlertType('success');
                    setAlertVisible(true);
                    setTimeout(() => setAlertVisible(false), 1500);
                    allParentUUIDs.push(...result.parent_uuids);
                    totalVideoDuration += result.total_duration_seconds;
                } else {
                    setAlertMessage(`Error processing ${folderName}`);
                    setAlertType('error');
                }
            }
            if (onUUIDsGenerated, onVidDur) {
                onUUIDsGenerated(allParentUUIDs);
                onVidDur(totalVideoDuration)
            }

            // Close modal after successful upload
            if (onUploadComplete) {
                onUploadComplete(selectedItems.length, totalVideoDuration);
            }
        } catch (error) {
            console.error('Error uploading files to S3:', error);
            setAlertMessage('An error occurred while uploading files');
            setAlertType('error');
            setAlertVisible(true);
        } finally {
            setIsUploading(false);
        }
    };



    return (
<div>
    {!accessKey || !secretKey || !bucketName ? (
        <div style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            marginBottom: '20px'
        }}>
            <p style={{ margin: 0, color: '#856404' }}>
                <strong>S3 credentials not configured.</strong> Please configure your AWS Access Key, Secret Key, and Bucket Name in the settings (gear icon) before browsing S3 folders.
            </p>
        </div>
    ) : (
        <>
            <Breadcrumb>
                <Breadcrumb.Item>
                    <a onClick={() => setCurrentPath('')}>{bucketName}</a>
                </Breadcrumb.Item>
                {currentPath.split('/').filter(Boolean).map((part, index, arr) => {
                    const path = arr.slice(0, index + 1).join('/') + '/';
                    return (
                        <Breadcrumb.Item key={path}>
                            <a onClick={() => handleBreadcrumbClick(path)}>{part}</a>
                        </Breadcrumb.Item>
                    );
                })}
            </Breadcrumb>
            <Spin spinning={loading}>
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '20px',
                marginTop: '20px',
                maxHeight: '400px',
                maxWidth: '600px',
                overflow: 'auto',
                border: '1px solid #ccc',
                padding: '10px',
                borderRadius: '8px',
                position: 'relative', // To position the loader
            }}
        >
            {items.map((item) => (
                <div
                    key={item.key}
                    onDoubleClick={() => handleDoubleClick(item)}
                    onClick={() => handleSingleClick(item)}
                    style={{
                        width: '100px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: selectedItems.includes(item.key) ? '2px solid #1890ff' : '2px solid transparent',
                        borderRadius: '8px',
                        padding: '10px',
                    }}
                >
                    {item.type === 'folder' ? (
                        <FolderOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    ) : (
                        <FileOutlined style={{ fontSize: '48px', color: '#555' }} />
                    )}
                    <p style={{ marginTop: '10px', fontSize: '12px', wordWrap: 'break-word' }}>{item.name}</p>
                </div>
            ))}
        </div>
            </Spin>

            {/* Dark overlay and centered loader */}
            {isUploading && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darken the screen
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000, // Ensure it's above other content
                    }}
                >
                    <div
                        className="loader"
                    ></div>
                </div>
            )}

            <div style={{ marginTop: '20px' }}>
                <Button type="primary" onClick={handleFileUploadS3} loading={isUploading}>
                    Upload Selected
                </Button>
            </div>
        </>
    )}
    <Alert
        message={alertMessage}
        type={alertType}
        visible={alertVisible}
        setVisible={setAlertVisible}
    />
</div>


    );
};

export default S3FileExplorer;
