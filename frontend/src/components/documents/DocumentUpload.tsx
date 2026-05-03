import React, { useState, useRef } from 'react';
import { Upload, X, File, FileText, Image, Film } from 'lucide-react';
import { Button } from '../common/Button';
import { useToastStore } from '../../stores/toastStore';
import api from '../../services/api';

interface DocumentUploadProps {
    entityType: 'lead' | 'project' | 'task';
    entityId: number;
    onUploadSuccess?: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ entityType, entityId, onUploadSuccess }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToastStore();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const handleFileSelection = (selectedFile: File) => {
        // Basic validation
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (selectedFile.size > maxSize) {
            addToast('File is too large (max 10MB)', 'error');
            return;
        }
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('document', file);
        formData.append('documentable_type', entityType);
        formData.append('documentable_id', entityId.toString());
        formData.append('name', file.name);

        try {
            await api.post('/documents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            addToast('Document uploaded successfully', 'success');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (onUploadSuccess) onUploadSuccess();
        } catch (error: any) {
            console.error(error);
            addToast(error.response?.data?.message || 'Failed to upload document', 'error');
        } finally {
            setUploading(false);
        }
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
        if (type.startsWith('video/')) return <Film className="w-8 h-8 text-purple-500" />;
        if (type.includes('pdf') || type.includes('word')) return <FileText className="w-8 h-8 text-red-500" />;
        return <File className="w-8 h-8 text-gray-500" />;
    };

    return (
        <div className="space-y-4">
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                    } ${file ? 'hidden' : 'block'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="sr-only"
                            onChange={handleFileInput}
                        />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">Up to 10MB</p>
            </div>

            {file && (
                <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {getFileIcon(file.type)}
                        <div>
                            <p className="font-medium text-sm text-gray-900 truncate max-w-xs">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            disabled={uploading}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleUpload} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
