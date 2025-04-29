import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import PasswordInputField from '../components/PasswordInputField';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { GlobleContext } from '../context/Context';

const LoginPage: React.FC<{ register?: boolean }> = ({ register = false }) => {
    const { userDispatch } = useContext(GlobleContext);

    const [usernameInput, setUsernameInput] = useState<string>('');
    const [passwordInput, setPasswordInput] = useState<{
        password: string;
        confirmPassword: string;
    }>({
        password: '',
        confirmPassword: '',
    });

    const [usernameError, setUsernameError] =
        useState<string>('Enter username');
    const [passwordError, setPasswordError] =
        useState<string>('Enter Password');
    const [confirmPasswordError, setConfirmPasswordError] = useState<string>(
        'Enter password again'
    );

    const navigate = useNavigate();

    const handleUsername = (event: React.ChangeEvent<HTMLInputElement>) => {
        const username = event.target.value.trim();
        setUsernameInput(event.target.value);
        if (username.length > 3) {
            setUsernameError('');
        } else {
            setUsernameError('Username must contain at least 4 characters');
        }
    };

    const handlePasswordChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const passwordInputValue = event.target.value.trim();
        const passwordInputFieldName = event.target.placeholder;
        const newPasswordInput = {
            ...passwordInput,
            [passwordInputFieldName]: passwordInputValue,
        };
        setPasswordInput(newPasswordInput);

        if (passwordInputFieldName === 'password') {
            const uppercaseRegExp = /(?=.*?[A-Z])/;
            const lowercaseRegExp = /(?=.*?[a-z])/;
            const digitsRegExp = /(?=.*?[0-9])/;
            const specialCharRegExp = /(?=.*?[<,>,!,#,%,~,_,+,=,@,*])/;
            const minLengthRegExp = /.{8,}/;

            const passwordLength = passwordInputValue.length;
            const uppercasePassword = uppercaseRegExp.test(passwordInputValue);
            const lowercasePassword = lowercaseRegExp.test(passwordInputValue);
            const digitsPassword = digitsRegExp.test(passwordInputValue);
            const specialCharPassword =
                specialCharRegExp.test(passwordInputValue);
            const minLengthPassword = minLengthRegExp.test(passwordInputValue);

            let errorMsg = '';
            if (passwordLength === 0) {
                errorMsg = 'password is empty';
            } else if (!uppercasePassword) {
                errorMsg = 'At least one Uppercase Character';
            } else if (!lowercasePassword) {
                errorMsg = 'At least one lowercase Character';
            } else if (!digitsPassword) {
                errorMsg = 'At least one digit';
            } else if (!specialCharPassword) {
                errorMsg = 'At least one Special Characters';
            } else if (!minLengthPassword) {
                errorMsg = 'At least minimum 8 characters';
            } else {
                errorMsg = '';
            }

            setPasswordError(errorMsg);
        }

        if (
            passwordInputFieldName === 'confirmPassword' ||
            (passwordInputFieldName === 'password' &&
                passwordInput.confirmPassword.length > 0)
        ) {
            if (passwordInputValue !== passwordInput.password) {
                setConfirmPasswordError('Confirm password is not matched');
            } else {
                setConfirmPasswordError('');
            }
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (passwordError || confirmPasswordError || usernameError) return;

        fetchLogin();
    };

    const fetchLogin = async () => {
        try {
            const result = await fetch(
                import.meta.env.VITE_BACKEND_API_URL + 'api/User/login',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: usernameInput,
                        password: passwordInput.password,
                    }),
                }
            ).then((res) => res.json());
            if (result.accessToken) {
                localStorage.setItem('jwtToken', result.accessToken);
                localStorage.setItem('refreshToken', result.refreshToken);
                localStorage.setItem('username', usernameInput); //
                userDispatch({
                    type: 'LOGIN',
                    payload: {
                        username: usernameInput,
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                    },
                });
                alert('Login success!!');
                navigate('/');
            }
        } catch (error) {
            alert(error);
        }
    };

    useEffect(() => {
        if (!register) {
            setConfirmPasswordError('');
        } else {
            setConfirmPasswordError('Enter password again');
        }
    }, [register]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-sm p-6 shadow-xl rounded-2xl">
                <CardContent>
                    <h1 className="text-2xl font-bold mb-4 text-center">
                        {register ? 'Register Form' : 'Login Form'}
                    </h1>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Username"
                                value={usernameInput}
                                onChange={handleUsername}
                                required
                            />
                            <p className="text-danger">{usernameError}</p>
                        </div>

                        <div>
                            <PasswordInputField
                                handlePasswordChange={handlePasswordChange}
                                passwordValue={passwordInput.password}
                                passwordError={passwordError}
                                placeholder="password"
                            />
                        </div>
                        {register && (
                            <div>
                                <PasswordInputField
                                    handlePasswordChange={handlePasswordChange}
                                    passwordValue={
                                        passwordInput.confirmPassword
                                    }
                                    passwordError={confirmPasswordError}
                                    placeholder="confirmPassword"
                                />
                            </div>
                        )}
                        <Button className="w-full" type="submit">
                            {register ? 'Register' : 'Login'}
                        </Button>
                    </form>
                    <p className="text-sm text-center mt-4 text-gray-500">
                        {register ? (
                            <>
                                Already have an account?{' '}
                                <a
                                    href="#"
                                    className="text-blue-600 hover:underline"
                                >
                                    Sign In
                                </a>
                            </>
                        ) : (
                            <>
                                Don't have an account?{' '}
                                <a
                                    href="#"
                                    className="text-blue-600 hover:underline"
                                >
                                    Sign up
                                </a>
                            </>
                        )}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;
