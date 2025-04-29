import React from 'react';
import { Input } from '../components/ui/input'; // Adjust this import according to your file structure

interface Props {
    handlePasswordChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    passwordValue: string;
    passwordError: string;
    placeholder: string;
}

const PasswordInputField: React.FC<Props> = ({
    handlePasswordChange,
    passwordValue,
    passwordError,
    placeholder,
}) => {
    return (
        <div className="form-group my-3">
            <Input
                type="password"
                value={passwordValue}
                onChange={handlePasswordChange}
                placeholder={placeholder}
                className="form-control"
            />
            {passwordError && <p className="text-danger">{passwordError}</p>}
        </div>
    );
};

export default PasswordInputField;
