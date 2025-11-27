// src/components/DataTable.jsx
import React from "react";
import "./DataTable.css";

export default function DataTable({ columns, data, actions }) {
    return (
        <div className="data-table-container">
            <div className="data-table">
                <table>
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx}>{col.header}</th>
                            ))}
                            {actions && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="empty-state">
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIdx) => (
                                <tr key={rowIdx}>
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx}>
                                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="actions-cell">
                                            {actions(row)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
