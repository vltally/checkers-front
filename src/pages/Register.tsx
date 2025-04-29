import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { GlobleContext } from '../context/Context';

export default function SignUpPage() {
    const navigate = useNavigate();
    const { userDispatch } = useContext(GlobleContext);

    const [usernameInput, setUsernameInput] = useState('');
    const [passwordInput, setPasswordInput] = useState({
        password: '',
        confirmPassword: '',
    });

    const [usernameError, setUsernameError] = useState('Enter username');
    const [passwordError, setPasswordError] = useState('Enter Password');
    const [confirmPasswordError, setConfirmPasswordError] = useState(
        'Enter password again'
    );

    useEffect(() => {
        setConfirmPasswordError('Enter password again');
    }, []);

    const handleUsername = (event: React.ChangeEvent<HTMLInputElement>) => {
        const username = event.target.value.trim();
        setUsernameInput(event.target.value);
        setUsernameError(
            username.length > 3
                ? ''
                : 'Username must contain at least 4 characters'
        );
    };

    const handlePasswordChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { id, value } = event.target;
        const trimmed = value.trim();

        const newPasswordInput = { ...passwordInput, [id]: trimmed };
        setPasswordInput(newPasswordInput);

        if (id === 'password') {
            const uppercase = /(?=.*?[A-Z])/.test(trimmed);
            const lowercase = /(?=.*?[a-z])/.test(trimmed);
            const digits = /(?=.*?[0-9])/.test(trimmed);
            const specialChar = /(?=.*?[<,>,!,#,%,~,_,+,=,@,*])/.test(trimmed);
            const minLength = /.{8,}/.test(trimmed);

            let errorMsg = '';
            if (trimmed.length === 0) errorMsg = 'Password is empty';
            else if (!uppercase) errorMsg = 'At least one Uppercase Character';
            else if (!lowercase) errorMsg = 'At least one lowercase Character';
            else if (!digits) errorMsg = 'At least one digit';
            else if (!specialChar) errorMsg = 'At least one Special Character';
            else if (!minLength) errorMsg = 'At least 8 characters';
            else errorMsg = '';

            setPasswordError(errorMsg);
        }

        if (
            id === 'confirmPassword' ||
            (id === 'password' && passwordInput.confirmPassword.length > 0)
        ) {
            if (
                id === 'confirmPassword' &&
                trimmed !== passwordInput.password
            ) {
                setConfirmPasswordError('Confirm password does not match');
            } else if (
                id === 'password' &&
                passwordInput.confirmPassword !== trimmed
            ) {
                setConfirmPasswordError('Confirm password does not match');
            } else {
                setConfirmPasswordError('');
            }
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (usernameError || passwordError || confirmPasswordError) return;

        try {
            const result = await fetch(
                import.meta.env.VITE_BACKEND_API_URL + 'api/User/register',
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

            alert(result.message);
            navigate('/login');
        } catch (error) {
            alert('Registration failed' + error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-sm p-6 shadow-xl rounded-2xl">
                <CardContent>
                    <h1 className="text-2xl font-bold mb-4 text-center">
                        Sign Up
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
                            <p className="text-sm text-red-600">
                                {usernameError}
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={passwordInput.password}
                                onChange={handlePasswordChange}
                                required
                            />
                            <p className="text-sm text-red-600">
                                {passwordError}
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="confirmPassword">
                                Confirm Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={passwordInput.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                            <p className="text-sm text-red-600">
                                {confirmPasswordError}
                            </p>
                        </div>
                        <Button className="w-full" type="submit">
                            Sign Up
                        </Button>
                    </form>
                    <p className="text-sm text-center mt-4 text-gray-500">
                        Already have an account?{' '}
                        <a
                            href="/login"
                            className="text-blue-600 hover:underline"
                        >
                            Sign In
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
