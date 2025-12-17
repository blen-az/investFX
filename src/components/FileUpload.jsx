// src/components/FileUpload.jsx
import React, { useState } from 'react';
import './FileUpload.css';

export default function FileUpload({ onFileSelect, label = "Upload ID Document" }) {
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            onFileSelect?.(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setFileName(file.name);
            onFileSelect?.(file);
        }
    };

    return (
        <div className="file-upload-container">
            <label className="file-upload-label">{label}</label>

            <div
                className={`file-upload-zone ${isDragging ? 'dragging' : ''} ${fileName ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id="fileInput"
                    className="file-input-hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                />

                <div className="file-upload-content">
                    <div className="file-icon">
                        {fileName ? '📄' : '📤'}
                    </div>

                    {fileName ? (
                        <div className="file-info">
                            <div className="file-name">{fileName}</div>
                            <div className="file-status">✓ Ready to upload</div>
                        </div>
                    ) : (
                        <div className="file-placeholder">
                            <div className="upload-text">Drag & drop your ID here</div>
                            <div className="upload-subtext">or</div>
                        </div>
                    )}
                </div>

                <label htmlFor="fileInput" className="file-choose-button">
                    {fileName ? 'Change File' : 'Choose File'}
                </label>
            </div>

            <div className="file-upload-hint">
                Accepted formats: JPG, PNG, PDF • Max size: 5MB
            </div>
        </div>
    );
}
