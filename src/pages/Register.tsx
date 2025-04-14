import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-sm p-6 shadow-xl rounded-2xl">
                <CardContent>
                    <h1 className="text-2xl font-bold mb-4 text-center">
                        Sign Up
                    </h1>
                    <form className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Username"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="confirmPassword">
                                Confirm Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <Button className="w-full" type="submit">
                            Sign Up
                        </Button>
                    </form>
                    <p className="text-sm text-center mt-4 text-gray-500">
                        Already have an account?{' '}
                        <a href="#" className="text-blue-600 hover:underline">
                            Sign In
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
