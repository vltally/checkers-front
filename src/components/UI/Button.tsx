import React from "react";
import "./Button.css"; // Підключаємо файл зі стилями

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}

export const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    className = "",
    disabled = false,
    type = "button",
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`custom-button ${className}`}
        >
            {children}
        </button>
    );
};