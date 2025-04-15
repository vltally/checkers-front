import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './components/ui/dialog';
import { useContext, useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router';
import './App.css';
import ChessboardOnline from './components/Chessboard/ChessboardOnline';
import Header from './components/Header';
import { Button } from './components/ui/button';
import { GlobleContext } from './context/Context';
import Home from './pages/Home';
import Login from './pages/Login';
import { Play } from './pages/Play';
import Register from './pages/Register';

function App() {
    const [show, setShow] = useState<boolean>(false);

    const {
        userState: { isLogin, username },
        userDispatch,
        signalRState: {
            signalRService,
            onlineUsers,
            message,
            privateRoomRequest,
            privateRoomInitiated,
        },
        signalRDispatch,
    } = useContext(GlobleContext);

    const handleAccept = () => {
        setShow(false);
        signalRService?.createPrivateRoom({
            from: username,
            to: message.from,
            content: 'Accepted',
        });
        signalRDispatch({ type: 'OPEN_PRIVATE_ROOM', payload: message });
    };

    const handleReject = () => {
        setShow(false);
        signalRDispatch({
            type: 'REJECT_PRIVATE_ROOM_REQUEST',
            payload: { from: '', to: '', content: '' },
        });
        signalRService?.rejectPrivateRoomRequest({
            from: username,
            to: message.from,
            content: 'Reject request',
        });
    };

    const handleClosePrivateRoom = () => {
        signalRService?.closePrivateRoom({
            from: username,
            to:
                privateRoomInitiated.accepted !== username
                    ? privateRoomInitiated.accepted
                    : privateRoomInitiated.requested,
            content: 'ClosePrivateRoom',
        });
    };

    useEffect(() => {
        if (privateRoomInitiated.accepted && privateRoomInitiated.requested) {
            const patner =
                privateRoomInitiated.accepted !== username
                    ? privateRoomInitiated.accepted
                    : privateRoomInitiated.requested;
            const result = onlineUsers.find((user) => user.key === patner);
            if (!result) {
                alert(`${patner} Connection lost`);
                signalRDispatch({
                    type: 'CLOSE_PRIVATE_ROOM',
                    payload: { from: '', to: '', content: '' },
                });
            }
        }
    }, [onlineUsers]);

    useEffect(() => {
        if (privateRoomRequest) {
            setShow(true);
        } else {
            setShow(false);
        }
    }, [privateRoomRequest]);

    useEffect(() => {
        if (message.content === 'UserLogout' && message.from === username) {
            userDispatch({ type: 'LOGOUT', payload: null });
            signalRService?.removeUserCnnection();
            signalRDispatch({
                type: 'REMOVE_SIGNALR_CONNECTION',
                payload: null,
            });
        } else if (
            message.content === 'UserLogout' &&
            message.to === username
        ) {
            alert(`${message.from} is logged out`);
        } else if (
            message.content === 'ClosePrivateRoom' &&
            message.from !== username
        ) {
            alert(`${message.from} is closed the private room`);
        }
    }, [message]);

    return (
        <div>
            <div>
                <Header />
                {privateRoomInitiated.accepted &&
                privateRoomInitiated.requested ? (
                    <div className="d-flex flex-column align-items-center">
                        <div className="mt-2">
                            <h2>
                                In A private Room{' '}
                                {privateRoomInitiated.accepted} -{' '}
                                {privateRoomInitiated.requested}
                            </h2>
                        </div>
                        <div
                            style={{
                                width: '40vw',
                                height: '70vh',
                                display: 'flex',
                            }}
                        >
                            <ChessboardOnline />
                        </div>
                        <Button onClick={handleClosePrivateRoom}>
                            Close Private Room
                        </Button>
                    </div>
                ) : (
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/play"
                            element={
                                isLogin ? (
                                    <Play />
                                ) : (
                                    <div>
                                        <h2>
                                            Please Login to play Online Or
                                            <NavLink to={'/'}>
                                                {' '}
                                                Go to Home for the Single Player
                                            </NavLink>
                                        </h2>
                                    </div>
                                )
                            }
                        />
                    </Routes>
                )}
            </div>
            <Dialog open={show} onOpenChange={() => {}}>
                <DialogContent
                    className="sm:max-w-md"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {message.from} is Requesting to play online
                        </DialogTitle>
                        <DialogDescription>
                            Accept for online play or reject the request
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="destructive" onClick={handleReject}>
                            Reject
                        </Button>
                        <Button onClick={handleAccept}>Accept</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default App;
