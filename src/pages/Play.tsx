import React, { useContext } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
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
        <div className="flex-auto">
            {handleOnlineUsers().length > 0 ? (
                <>
                    <h1>Online Users</h1>
                    <ol className="list-group list-group-numbered">
                        {handleOnlineUsers().map((user, index) => (
                            <li
                                className="list-group-item d-flex justify-content-between align-items-start"
                                key={index}
                            >
                                <div className="ms-2 me-auto">
                                    <div className="fw-bold">{user.key}</div>
                                    {user.value ? (
                                        <span
                                            className="fw-bold"
                                            style={{ color: '#ff2200' }}
                                        >
                                            In a private Room
                                        </span>
                                    ) : (
                                        <span
                                            className="fw-bold"
                                            style={{ color: '#6fff00' }}
                                        >
                                            Online
                                        </span>
                                    )}
                                </div>
                                <Button
                                    disabled={user.value}
                                    className="fs-5 fw-bold"
                                    onClick={() =>
                                        handlePrivateRoomRequest(user.key)
                                    }
                                >
                                    Play
                                </Button>
                            </li>
                        ))}
                    </ol>
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
