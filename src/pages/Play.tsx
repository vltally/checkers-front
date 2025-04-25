import React, { useContext } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../components/ui/card';
import { GlobleContext } from '../context/Context';

export const Play: React.FC = () => {
    const {
        userState: { username },
        signalRState: { signalRService, onlineUsers },
    } = useContext(GlobleContext);

    const handleOnlineUsers = () => {
        return onlineUsers.filter((user) => user.key !== username);
    };

    const handlePrivateRoomRequest = (user: string) => {
        console.log('handler started his work');
        signalRService?.privateRoomRequest({
            from: username,
            to: user,
            content: 'Private Room Request',
        });
    };

    return (
        <div className="flex-auto p-4">
            {handleOnlineUsers().length > 0 ? (
                <>
                    <h1 className="text-2xl font-bold mb-4">Online Users</h1>
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {handleOnlineUsers().map((user, index) => (
                            <Card key={index} className="shadow">
                                <CardHeader>
                                    <CardTitle>{user.key}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {user.value ? (
                                        <p className="text-red-500 font-semibold">
                                            In a Private Room
                                        </p>
                                    ) : (
                                        <p className="text-green-500 font-semibold">
                                            Online
                                        </p>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        disabled={user.value}
                                        className="w-full"
                                        onClick={() =>
                                            handlePrivateRoomRequest(user.key)
                                        }
                                    >
                                        Play
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                <div className="px-5 my-10">
                    <Alert>
                        <AlertTitle>There are no online players</AlertTitle>
                        <AlertDescription className="text-center">
                            Please wait until some players get online
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    );
};

export default Play;
