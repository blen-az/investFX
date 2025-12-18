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
                    <p><strong>InvestFX Limited</strong></p>
                    <p>Registered Address: [Your Address]</p>
                    <p>Registration Number: [Registration Number]</p>
                </section>

                <section>
                    <h2>Licenses & Regulations</h2>
                    <p>Licensed and regulated by [Regulatory Body]</p>
                    <p>License Number: [License Number]</p>
                </section>

                <section>
                    <h2>Legal Documents</h2>
                    <div className="doc-links">
                        <a href="#">Terms of Service</a>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Risk Disclosure</a>
                        <a href="#">AML Policy</a>
                    </div>
                </section>
            </div>
        </div>
    );
}
