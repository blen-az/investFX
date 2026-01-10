// src/pages/RegulatoryInfo.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './SimpleFeaturePage.css';

export default function RegulatoryInfo() {
    return (
        <div className="simple-feature-page">
            <div className="page-header">
                <Link to="/wallet" className="back-button">← Back</Link>
                <h1>Regulatory Information</h1>
            </div>

            <div className="feature-container regulatory-content">
                <section>
                    <h2>Company Information</h2>
                    <p><strong>WayMore Trading Financial Services Ltd.</strong></p>
                    <p>WayMore Trading is a global leader in digital asset trading, providing secure and transparent financial services to millions of users worldwide. Our platform is built on cutting-edge blockchain technology and advanced security protocols.</p>
                    <p>Registered Address: 128 City Road, London, EC1V 2NX, United Kingdom</p>
                    <p>Registration Number: 12984572</p>
                </section>

                <section>
                    <h2>Licenses & Regulations</h2>
                    <p>WayMore Trading operates in compliance with international financial regulations. We are committed to maintaining the highest standards of transparency and user protection.</p>
                    <p>MSB License: 31000258412095 (FinCEN Regulation)</p>
                    <p>VASP Registration: VASP-2023-08-11</p>
                </section>

                <section>
                    <h2>Legal Documents</h2>
                    <div className="doc-links">
                        <Link to="/terms">Terms of Service</Link>
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/risk">Risk Disclosure</Link>
                        <Link to="/aml">AML & KYC Policy</Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
