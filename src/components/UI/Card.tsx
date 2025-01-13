import React from "react";
import "./Card.css";

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
    return <div className={`custom-card ${className}`}>{children}</div>;
};

interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = "" }) => {
    return <h2 className={`custom-card-title ${className}`}>{children}</h2>;
};


interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = "" }) => {
    return <div className={`custom-card-header ${className}`}>{children}</div>;
};


interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = "" }) => {
    return <div className={`custom-card-content ${className}`}>{children}</div>;
};
