import { useContext, useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router';
import './App.css';
import { GlobleContext } from './context/Context';
import Home from './pages/Home';
import Login from './pages/Login';
import { Play } from './pages/Play';
import Register from './pages/Register';
import Header from './components/Header';

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
        <>
            <Header />
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
        </>
    );
}

export default App;
